import Foundation
import Network
import React

@objc(StreamGuardModule)
class StreamGuardModule: RCTEventEmitter {
  private let workerQueue = DispatchQueue(label: "com.radiopodcastplayer.streamguard.queue", qos: .utility)
  private var pathMonitor: NWPathMonitor?
  private var healthTimer: DispatchSourceTimer?
  private var reconnectWorkItem: DispatchWorkItem?

  private var monitoredStreamUrl: String = ""
  private var lastTransportType: String = "unknown"
  private var hasListeners: Bool = false

  private let eventNetworkState = "StreamGuardNetworkState"
  private let eventRecoveryStatus = "StreamGuardRecoveryStatus"
  private let maxReconnectAttempts = 12
  private let maxBackoffDelayMs = 30000
  private let healthCheckIntervalSeconds: TimeInterval = 8.0

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return [eventNetworkState, eventRecoveryStatus]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(startMonitoring:resolver:rejecter:)
  func startMonitoring(
    _ streamUrl: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    workerQueue.async { [weak self] in
      guard let self = self else {
        resolve(nil)
        return
      }

      self.monitoredStreamUrl = streamUrl.trimmingCharacters(in: .whitespacesAndNewlines)
      self.reconnectWorkItem?.cancel()
      self.stopHealthCheckTimer()
      self.startPathMonitorIfNeeded()

      if self.monitoredStreamUrl.isEmpty {
        self.emitRecoveryStatus(
          phase: "idle",
          attempt: 0,
          delayMs: 0,
          streamUrl: "",
          reason: "empty_url"
        )
        resolve(nil)
        return
      }

      self.emitRecoveryStatus(
        phase: "monitoring",
        attempt: 0,
        delayMs: 0,
        streamUrl: self.monitoredStreamUrl,
        reason: "monitoring_started"
      )

      self.startHealthCheckTimer()
      resolve(nil)
    }
  }

  @objc(stopMonitoring:rejecter:)
  func stopMonitoring(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    workerQueue.async { [weak self] in
      guard let self = self else {
        resolve(nil)
        return
      }

      self.monitoredStreamUrl = ""
      self.reconnectWorkItem?.cancel()
      self.reconnectWorkItem = nil
      self.stopHealthCheckTimer()
      self.stopPathMonitor()

      self.emitRecoveryStatus(
        phase: "idle",
        attempt: 0,
        delayMs: 0,
        streamUrl: "",
        reason: "monitoring_stopped"
      )
      resolve(nil)
    }
  }

  @objc(triggerManualReconnect:rejecter:)
  func triggerManualReconnect(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    workerQueue.async { [weak self] in
      guard let self = self else {
        resolve(nil)
        return
      }

      if !self.monitoredStreamUrl.isEmpty {
        self.scheduleReconnectAttempt(attempt: 1, targetUrl: self.monitoredStreamUrl, reason: "manual_reconnect")
      }
      resolve(nil)
    }
  }

  @objc(isIgnoringBatteryOptimizations:rejecter:)
  func isIgnoringBatteryOptimizations(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(true)
  }

  @objc(requestIgnoreBatteryOptimizations:rejecter:)
  func requestIgnoreBatteryOptimizations(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(true)
  }

  override func invalidate() {
    super.invalidate()
    workerQueue.async { [weak self] in
      self?.monitoredStreamUrl = ""
      self?.reconnectWorkItem?.cancel()
      self?.stopHealthCheckTimer()
      self?.stopPathMonitor()
    }
  }

  private func startPathMonitorIfNeeded() {
    if pathMonitor != nil {
      return
    }

    let monitor = NWPathMonitor()
    monitor.pathUpdateHandler = { [weak self] path in
      guard let self = self else { return }
      let isConnected = path.status == .satisfied
      let transport = self.resolveTransport(from: path)
      let previousTransport = self.lastTransportType
      self.lastTransportType = transport

      self.emitNetworkState(isConnected: isConnected, transport: transport)

      guard !self.monitoredStreamUrl.isEmpty else { return }

      if !isConnected {
        self.scheduleReconnectAttempt(
          attempt: 1,
          targetUrl: self.monitoredStreamUrl,
          reason: "network_unsatisfied"
        )
      } else if previousTransport != "unknown" && previousTransport != transport {
        self.scheduleReconnectAttempt(
          attempt: 1,
          targetUrl: self.monitoredStreamUrl,
          reason: "interface_changed_\(previousTransport)_to_\(transport)"
        )
      }
    }

    pathMonitor = monitor
    monitor.start(queue: workerQueue)
  }

  private func stopPathMonitor() {
    pathMonitor?.cancel()
    pathMonitor = nil
  }

  private func startHealthCheckTimer() {
    stopHealthCheckTimer()
    let timer = DispatchSource.makeTimerSource(queue: workerQueue)
    timer.schedule(
      deadline: .now() + healthCheckIntervalSeconds,
      repeating: healthCheckIntervalSeconds
    )
    timer.setEventHandler { [weak self] in
      guard let self = self, !self.monitoredStreamUrl.isEmpty else { return }
      let targetUrl = self.monitoredStreamUrl
      self.probeStreamEndpoint(urlString: targetUrl) { reachable in
        if !reachable && self.reconnectWorkItem == nil && self.monitoredStreamUrl == targetUrl {
          self.scheduleReconnectAttempt(
            attempt: 1,
            targetUrl: targetUrl,
            reason: "stream_probe_unreachable"
          )
        }
      }
    }
    healthTimer = timer
    timer.resume()
  }

  private func stopHealthCheckTimer() {
    healthTimer?.cancel()
    healthTimer = nil
  }

  private func scheduleReconnectAttempt(attempt: Int, targetUrl: String, reason: String) {
    reconnectWorkItem?.cancel()
    reconnectWorkItem = nil

    guard !monitoredStreamUrl.isEmpty, monitoredStreamUrl == targetUrl else {
      return
    }

    if attempt > maxReconnectAttempts {
      emitRecoveryStatus(
        phase: "failed",
        attempt: maxReconnectAttempts,
        delayMs: 0,
        streamUrl: targetUrl,
        reason: "max_attempts_exceeded"
      )
      return
    }

    let rawSeconds = Int(pow(2.0, Double(attempt - 1)))
    let delayMs = min(rawSeconds * 1000, maxBackoffDelayMs)

    emitRecoveryStatus(
      phase: "reconnecting",
      attempt: attempt,
      delayMs: delayMs,
      streamUrl: targetUrl,
      reason: reason
    )

    let workItem = DispatchWorkItem { [weak self] in
      guard let self = self, self.monitoredStreamUrl == targetUrl else { return }
      self.probeStreamEndpoint(urlString: targetUrl) { reachable in
        guard self.monitoredStreamUrl == targetUrl else { return }
        if reachable {
          self.reconnectWorkItem = nil
          self.emitRecoveryStatus(
            phase: "recovered",
            attempt: attempt,
            delayMs: 0,
            streamUrl: targetUrl,
            reason: "stream_reachable"
          )
        } else {
          self.scheduleReconnectAttempt(attempt: attempt + 1, targetUrl: targetUrl, reason: reason)
        }
      }
    }

    reconnectWorkItem = workItem
    workerQueue.asyncAfter(deadline: .now() + .milliseconds(delayMs), execute: workItem)
  }

  private func probeStreamEndpoint(urlString: String, completion: @escaping (Bool) -> Void) {
    guard let url = URL(string: urlString) else {
      completion(false)
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.timeoutInterval = 4.5
    request.setValue("RadioPodcastPlayer/1.0", forHTTPHeaderField: "User-Agent")
    request.setValue("0", forHTTPHeaderField: "Icy-MetaData")
    request.setValue("bytes=0-1", forHTTPHeaderField: "Range")

    let task = URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
      guard let self = self else { return }
      self.workerQueue.async {
        if error != nil {
          completion(false)
          return
        }
        if let httpResponse = response as? HTTPURLResponse {
          completion((200...399).contains(httpResponse.statusCode))
        } else {
          completion(false)
        }
      }
    }
    task.resume()
  }

  private func resolveTransport(from path: NWPath) -> String {
    if path.status != .satisfied {
      return "none"
    }
    if path.usesInterfaceType(.wifi) {
      return "wifi"
    }
    if path.usesInterfaceType(.cellular) {
      return "cellular"
    }
    if path.usesInterfaceType(.wiredEthernet) {
      return "ethernet"
    }
    return "unknown"
  }

  private func emitNetworkState(isConnected: Bool, transport: String) {
    guard hasListeners else { return }
    sendEvent(withName: eventNetworkState, body: [
      "isConnected": isConnected,
      "transport": transport,
      "timestamp": Date().timeIntervalSince1970 * 1000
    ])
  }

  private func emitRecoveryStatus(
    phase: String,
    attempt: Int,
    delayMs: Int,
    streamUrl: String,
    reason: String
  ) {
    guard hasListeners else { return }
    sendEvent(withName: eventRecoveryStatus, body: [
      "phase": phase,
      "attempt": attempt,
      "delayMs": delayMs,
      "streamUrl": streamUrl,
      "reason": reason
    ])
  }
}
