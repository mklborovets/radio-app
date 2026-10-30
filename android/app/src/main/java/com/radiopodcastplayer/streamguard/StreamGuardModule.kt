package com.radiopodcastplayer.streamguard

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.min
import kotlin.math.pow

class StreamGuardModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var monitorJob: Job? = null
    private var reconnectJob: Job? = null

    @Volatile
    private var monitoredStreamUrl: String = ""

    @Volatile
    private var lastTransportType: String = "unknown"

    private var networkCallbackRegistered = false

    private val connectivityManager: ConnectivityManager? by lazy {
        reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
    }

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            val transport = resolveTransportType(network)
            val previousTransport = lastTransportType
            lastTransportType = transport

            emitNetworkStateEvent(isConnected = true, transport = transport)

            if (monitoredStreamUrl.isNotEmpty() && previousTransport != transport) {
                triggerExponentialBackoffRecovery("transport_changed_${previousTransport}_to_${transport}")
            }
        }

        override fun onCapabilitiesChanged(
            network: Network,
            networkCapabilities: NetworkCapabilities
        ) {
            val transport = resolveTransportFromCapabilities(networkCapabilities)
            if (transport != lastTransportType) {
                val previousTransport = lastTransportType
                lastTransportType = transport
                emitNetworkStateEvent(isConnected = true, transport = transport)
                if (monitoredStreamUrl.isNotEmpty()) {
                    triggerExponentialBackoffRecovery("capabilities_changed_${previousTransport}_to_${transport}")
                }
            }
        }

        override fun onLost(network: Network) {
            lastTransportType = "none"
            emitNetworkStateEvent(isConnected = false, transport = "none")
            if (monitoredStreamUrl.isNotEmpty()) {
                triggerExponentialBackoffRecovery("network_lost")
            }
        }
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun startMonitoring(streamUrl: String, promise: Promise) {
        monitoredStreamUrl = streamUrl.trim()
        registerNetworkCallbackIfNeeded()

        reconnectJob?.cancel()
        monitorJob?.cancel()

        if (monitoredStreamUrl.isEmpty()) {
            emitRecoveryStatusEvent(
                phase = "idle",
                attempt = 0,
                delayMs = 0,
                streamUrl = "",
                reason = "empty_url"
            )
            promise.resolve(null)
            return
        }

        emitRecoveryStatusEvent(
            phase = "monitoring",
            attempt = 0,
            delayMs = 0,
            streamUrl = monitoredStreamUrl,
            reason = "monitoring_started"
        )

        monitorJob = scope.launch {
            while (isActive && monitoredStreamUrl.isNotEmpty()) {
                delay(HEALTH_CHECK_INTERVAL_MS)
                if (!isActive || monitoredStreamUrl.isEmpty()) {
                    break
                }
                val isReachable = probeStreamEndpoint(monitoredStreamUrl)
                if (!isReachable && reconnectJob?.isActive != true) {
                    triggerExponentialBackoffRecovery("stream_probe_unreachable")
                }
            }
        }

        promise.resolve(null)
    }

    @ReactMethod
    fun stopMonitoring(promise: Promise) {
        monitoredStreamUrl = ""
        reconnectJob?.cancel()
        monitorJob?.cancel()
        unregisterNetworkCallbackIfNeeded()

        emitRecoveryStatusEvent(
            phase = "idle",
            attempt = 0,
            delayMs = 0,
            streamUrl = "",
            reason = "monitoring_stopped"
        )
        promise.resolve(null)
    }

    @ReactMethod
    fun triggerManualReconnect(promise: Promise) {
        if (monitoredStreamUrl.isNotEmpty()) {
            triggerExponentialBackoffRecovery("manual_reconnect")
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            promise.resolve(true)
            return
        }
        val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val isIgnoring = powerManager?.isIgnoringBatteryOptimizations(reactContext.packageName) ?: false
        promise.resolve(isIgnoring)
    }

    @ReactMethod
    fun requestIgnoreBatteryOptimizations(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            promise.resolve(true)
            return
        }

        try {
            val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
            val alreadyIgnoring =
                powerManager?.isIgnoringBatteryOptimizations(reactContext.packageName) ?: false
            if (alreadyIgnoring) {
                promise.resolve(true)
                return
            }

            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${reactContext.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        Unit
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        Unit
    }

    override fun invalidate() {
        super.invalidate()
        monitoredStreamUrl = ""
        reconnectJob?.cancel()
        monitorJob?.cancel()
        unregisterNetworkCallbackIfNeeded()
        scope.cancel()
    }

    private fun triggerExponentialBackoffRecovery(reason: String) {
        val targetUrl = monitoredStreamUrl
        if (targetUrl.isEmpty()) {
            return
        }

        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            var attempt = 1
            while (isActive && monitoredStreamUrl == targetUrl && attempt <= MAX_RECONNECT_ATTEMPTS) {
                val rawDelaySec = 2.0.pow((attempt - 1).toDouble()).toLong()
                val delayMs = min(rawDelaySec * 1000L, MAX_BACKOFF_DELAY_MS)

                emitRecoveryStatusEvent(
                    phase = "reconnecting",
                    attempt = attempt,
                    delayMs = delayMs.toInt(),
                    streamUrl = targetUrl,
                    reason = reason
                )

                delay(delayMs)
                if (!isActive || monitoredStreamUrl != targetUrl) {
                    return@launch
                }

                val probeOk = probeStreamEndpoint(targetUrl)
                if (probeOk) {
                    emitRecoveryStatusEvent(
                        phase = "recovered",
                        attempt = attempt,
                        delayMs = 0,
                        streamUrl = targetUrl,
                        reason = "stream_reachable"
                    )
                    return@launch
                }

                attempt += 1
            }

            if (isActive && monitoredStreamUrl == targetUrl) {
                emitRecoveryStatusEvent(
                    phase = "failed",
                    attempt = MAX_RECONNECT_ATTEMPTS,
                    delayMs = 0,
                    streamUrl = targetUrl,
                    reason = "max_attempts_exceeded"
                )
            }
        }
    }

    private fun probeStreamEndpoint(streamUrl: String): Boolean {
        var connection: HttpURLConnection? = null
        return try {
            val url = URL(streamUrl)
            connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = PROBE_TIMEOUT_MS
                readTimeout = PROBE_TIMEOUT_MS
                instanceFollowRedirects = true
                setRequestProperty("User-Agent", "RadioPodcastPlayer/1.0")
                setRequestProperty("Icy-MetaData", "0")
                setRequestProperty("Range", "bytes=0-1")
            }
            connection.connect()
            val responseCode = connection.responseCode
            responseCode in 200..399
        } catch (error: Exception) {
            false
        } finally {
            try {
                connection?.inputStream?.close()
            } catch (_: Exception) {
            }
            connection?.disconnect()
        }
    }

    private fun registerNetworkCallbackIfNeeded() {
        if (networkCallbackRegistered) {
            return
        }
        try {
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()
            connectivityManager?.registerNetworkCallback(request, networkCallback)
            networkCallbackRegistered = true
        } catch (_: Exception) {
        }
    }

    private fun unregisterNetworkCallbackIfNeeded() {
        if (!networkCallbackRegistered) {
            return
        }
        try {
            connectivityManager?.unregisterNetworkCallback(networkCallback)
        } catch (_: Exception) {
        } finally {
            networkCallbackRegistered = false
        }
    }

    private fun resolveTransportType(network: Network): String {
        val capabilities = connectivityManager?.getNetworkCapabilities(network) ?: return "unknown"
        return resolveTransportFromCapabilities(capabilities)
    }

    private fun resolveTransportFromCapabilities(capabilities: NetworkCapabilities): String {
        return when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
            else -> "unknown"
        }
    }

    private fun emitNetworkStateEvent(isConnected: Boolean, transport: String) {
        val payload = Arguments.createMap().apply {
            putBoolean("isConnected", isConnected)
            putString("transport", transport)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        sendEventToJs(EVENT_NETWORK_STATE, payload)
    }

    private fun emitRecoveryStatusEvent(
        phase: String,
        attempt: Int,
        delayMs: Int,
        streamUrl: String,
        reason: String
    ) {
        val payload = Arguments.createMap().apply {
            putString("phase", phase)
            putInt("attempt", attempt)
            putInt("delayMs", delayMs)
            putString("streamUrl", streamUrl)
            putString("reason", reason)
        }
        sendEventToJs(EVENT_RECOVERY_STATUS, payload)
    }

    private fun sendEventToJs(eventName: String, params: WritableMap) {
        if (!reactContext.hasActiveReactInstance()) {
            return
        }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    companion object {
        const val NAME = "StreamGuardModule"
        const val EVENT_NETWORK_STATE = "StreamGuardNetworkState"
        const val EVENT_RECOVERY_STATUS = "StreamGuardRecoveryStatus"
        private const val HEALTH_CHECK_INTERVAL_MS = 8000L
        private const val MAX_BACKOFF_DELAY_MS = 30000L
        private const val MAX_RECONNECT_ATTEMPTS = 12
        private const val PROBE_TIMEOUT_MS = 4500
    }
}
