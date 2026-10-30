import { Platform } from 'react-native';
import ReactNativeBlobUtil, {
  FetchBlobResponse,
  StatefulPromise,
} from 'react-native-blob-util';
import { create } from 'zustand';
import { database, EpisodeDownloadStatus, EpisodeModel, TableName } from '@shared/db';

export interface EpisodeDownloadTaskInfo {
  episodeId: string;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  status: EpisodeDownloadStatus;
}

export interface DownloadManagerStoreState {
  tasks: Record<string, EpisodeDownloadTaskInfo>;
  setTaskInfo: (episodeId: string, info: EpisodeDownloadTaskInfo) => void;
  removeTaskInfo: (episodeId: string) => void;
}

export const useDownloadManagerStore = create<DownloadManagerStoreState>((set) => ({
  tasks: {},
  setTaskInfo: (episodeId, info) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [episodeId]: info,
      },
    })),
  removeTaskInfo: (episodeId) =>
    set((state) => {
      const next = { ...state.tasks };
      delete next[episodeId];
      return { tasks: next };
    }),
}));

const activeBlobTasks = new Map<string, StatefulPromise<FetchBlobResponse>>();
const pausedByUserSet = new Set<string>();
let isCacheDirectoryInitialized = false;

export function getEpisodesCacheDirectoryPath(): string {
  return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/episodes_cache`;
}

export async function ensureEpisodesCacheDirectory(): Promise<string> {
  const dirPath = getEpisodesCacheDirectoryPath();
  if (isCacheDirectoryInitialized) {
    return dirPath;
  }

  const exists = await ReactNativeBlobUtil.fs.exists(dirPath);
  if (!exists) {
    await ReactNativeBlobUtil.fs.mkdir(dirPath);
  }

  if (Platform.OS === 'ios') {
    await ReactNativeBlobUtil.ios.excludeFromBackupKey(dirPath);
  }

  isCacheDirectoryInitialized = true;
  return dirPath;
}

function getFileExtensionFromUrl(audioUrl: string): string {
  const cleanUrl = audioUrl.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.m4a')) {
    return 'm4a';
  }
  if (cleanUrl.endsWith('.aac')) {
    return 'aac';
  }
  if (cleanUrl.endsWith('.ogg')) {
    return 'ogg';
  }
  return 'mp3';
}

export async function getEpisodeFilePaths(
  episodeId: string,
  audioUrl: string,
): Promise<{
  finalPath: string;
  partPath: string;
  chunkPath: string;
}> {
  const dirPath = await ensureEpisodesCacheDirectory();
  const ext = getFileExtensionFromUrl(audioUrl);
  const baseName = `${dirPath}/episode_${episodeId}.${ext}`;
  return {
    finalPath: baseName,
    partPath: `${baseName}.part`,
    chunkPath: `${baseName}.chunk`,
  };
}

async function getSafeFileSize(filePath: string): Promise<number> {
  try {
    const exists = await ReactNativeBlobUtil.fs.exists(filePath);
    if (!exists) {
      return 0;
    }
    const stat = await ReactNativeBlobUtil.fs.stat(filePath);
    const parsed =
      typeof stat.size === 'number'
        ? stat.size
        : Number.parseInt(String(stat.size), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

async function unlinkIfExists(filePath: string): Promise<void> {
  try {
    const exists = await ReactNativeBlobUtil.fs.exists(filePath);
    if (exists) {
      await ReactNativeBlobUtil.fs.unlink(filePath);
    }
  } catch {
    return;
  }
}

async function updateEpisodeDownloadFieldsInDb(
  episodeId: string,
  fields: {
    status: EpisodeDownloadStatus;
    progress: number;
    downloadedBytes: number;
    fileSize?: number;
    localFilePath?: string | null;
  },
): Promise<void> {
  const collection = database.get<EpisodeModel>(TableName.Episodes);
  try {
    const record = await collection.find(episodeId);
    await database.write(async () => {
      await record.update((item) => {
        item.downloadStatus = fields.status;
        item.downloadProgress = fields.progress;
        item.downloadedBytes = fields.downloadedBytes;
        if (typeof fields.fileSize === 'number' && fields.fileSize > 0) {
          item.fileSize = fields.fileSize;
        }
        if (fields.localFilePath !== undefined) {
          item.localFilePath = fields.localFilePath;
        }
      });
    });
  } catch {
    return;
  }
}

export async function startOrResumeEpisodeDownload(
  episodeId: string,
  onCompletedCallback?: () => Promise<void>,
): Promise<void> {
  if (activeBlobTasks.has(episodeId)) {
    return;
  }

  pausedByUserSet.delete(episodeId);
  const collection = database.get<EpisodeModel>(TableName.Episodes);
  const episode = await collection.find(episodeId);
  const { finalPath, partPath, chunkPath } = await getEpisodeFilePaths(
    episodeId,
    episode.audioUrl,
  );

  await unlinkIfExists(chunkPath);
  const existingPartBytes = await getSafeFileSize(partPath);
  const knownTotalBytes = episode.fileSize > 0 ? episode.fileSize : 0;
  const initialProgress =
    knownTotalBytes > 0
      ? Math.min(0.99, existingPartBytes / knownTotalBytes)
      : 0;

  useDownloadManagerStore.getState().setTaskInfo(episodeId, {
    episodeId,
    progress: initialProgress,
    downloadedBytes: existingPartBytes,
    totalBytes: knownTotalBytes,
    status: 'downloading',
  });

  await updateEpisodeDownloadFieldsInDb(episodeId, {
    status: 'downloading',
    progress: initialProgress,
    downloadedBytes: existingPartBytes,
  });

  const headers: Record<string, string> = {
    'User-Agent': 'RadioPodcastPlayer/1.0',
  };
  if (existingPartBytes > 0) {
    headers.Range = `bytes=${existingPartBytes}-`;
  }

  const destinationPath = existingPartBytes > 0 ? chunkPath : partPath;

  const task = ReactNativeBlobUtil.config({
    path: destinationPath,
    fileCache: true,
    overwrite: true,
    IOSBackgroundTask: true,
  }).fetch('GET', episode.audioUrl, headers);

  activeBlobTasks.set(episodeId, task);

  task.progress({ interval: 250 }, (receivedStr, totalStr) => {
    const receivedChunkBytes = Number(receivedStr) || 0;
    const responseRemainingTotal = Number(totalStr) || 0;
    const cumulativeDownloaded = existingPartBytes + receivedChunkBytes;
    const estimatedTotal =
      responseRemainingTotal > 0
        ? existingPartBytes + responseRemainingTotal
        : knownTotalBytes;
    const progress =
      estimatedTotal > 0
        ? Math.min(0.99, cumulativeDownloaded / estimatedTotal)
        : 0;

    useDownloadManagerStore.getState().setTaskInfo(episodeId, {
      episodeId,
      progress,
      downloadedBytes: cumulativeDownloaded,
      totalBytes: estimatedTotal,
      status: 'downloading',
    });
  });

  try {
    const response = await task;
    activeBlobTasks.delete(episodeId);

    const status = response.info().status;
    if (existingPartBytes > 0) {
      if (status === 206) {
        await ReactNativeBlobUtil.fs.appendFile(partPath, chunkPath, 'uri');
        await unlinkIfExists(chunkPath);
      } else if (status === 200) {
        await unlinkIfExists(partPath);
        await ReactNativeBlobUtil.fs.mv(chunkPath, partPath);
      } else {
        await unlinkIfExists(chunkPath);
        throw new Error(`Unexpected HTTP status ${status} during ranged download`);
      }
    } else if (status !== 200 && status !== 206) {
      throw new Error(`Download failed with HTTP status ${status}`);
    }

    await unlinkIfExists(finalPath);
    await ReactNativeBlobUtil.fs.mv(partPath, finalPath);

    if (Platform.OS === 'ios') {
      await ReactNativeBlobUtil.ios.excludeFromBackupKey(finalPath);
    }

    const finalBytes = await getSafeFileSize(finalPath);

    await updateEpisodeDownloadFieldsInDb(episodeId, {
      status: 'completed',
      progress: 1,
      downloadedBytes: finalBytes,
      fileSize: finalBytes,
      localFilePath: finalPath,
    });

    useDownloadManagerStore.getState().setTaskInfo(episodeId, {
      episodeId,
      progress: 1,
      downloadedBytes: finalBytes,
      totalBytes: finalBytes,
      status: 'completed',
    });

    if (onCompletedCallback) {
      await onCompletedCallback();
    }
  } catch {
    activeBlobTasks.delete(episodeId);

    if (existingPartBytes > 0) {
      const chunkBytes = await getSafeFileSize(chunkPath);
      if (chunkBytes > 0) {
        try {
          await ReactNativeBlobUtil.fs.appendFile(partPath, chunkPath, 'uri');
        } catch {
          // Ignore partial merge error on abrupt abort
        }
      }
      await unlinkIfExists(chunkPath);
    }

    const savedPartBytes = await getSafeFileSize(partPath);
    const totalBytes = knownTotalBytes > 0 ? knownTotalBytes : savedPartBytes;
    const nextProgress =
      totalBytes > 0 ? Math.min(0.99, savedPartBytes / totalBytes) : 0;
    const isPaused = pausedByUserSet.has(episodeId);
    const nextStatus: EpisodeDownloadStatus = isPaused ? 'paused' : 'failed';

    await updateEpisodeDownloadFieldsInDb(episodeId, {
      status: nextStatus,
      progress: nextProgress,
      downloadedBytes: savedPartBytes,
    });

    useDownloadManagerStore.getState().setTaskInfo(episodeId, {
      episodeId,
      progress: nextProgress,
      downloadedBytes: savedPartBytes,
      totalBytes,
      status: nextStatus,
    });
  }
}

export async function pauseEpisodeDownload(episodeId: string): Promise<void> {
  pausedByUserSet.add(episodeId);
  const runningTask = activeBlobTasks.get(episodeId);
  if (runningTask) {
    runningTask.cancel();
    activeBlobTasks.delete(episodeId);
  }
}

export async function deleteEpisodeDownloadedFiles(episodeId: string): Promise<void> {
  pausedByUserSet.delete(episodeId);
  const runningTask = activeBlobTasks.get(episodeId);
  if (runningTask) {
    runningTask.cancel();
    activeBlobTasks.delete(episodeId);
  }

  const collection = database.get<EpisodeModel>(TableName.Episodes);
  try {
    const episode = await collection.find(episodeId);
    const { finalPath, partPath, chunkPath } = await getEpisodeFilePaths(
      episodeId,
      episode.audioUrl,
    );

    if (episode.localFilePath) {
      await unlinkIfExists(episode.localFilePath);
    }
    await unlinkIfExists(finalPath);
    await unlinkIfExists(partPath);
    await unlinkIfExists(chunkPath);

    await updateEpisodeDownloadFieldsInDb(episodeId, {
      status: 'none',
      progress: 0,
      downloadedBytes: 0,
      localFilePath: null,
    });
    useDownloadManagerStore.getState().removeTaskInfo(episodeId);
  } catch {
    return;
  }
}
