import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Film,
  FolderPlus,
  Play,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import {
  inspectVideoFile,
  InstantMergeResult,
  MergeProgressInfo,
  mergeVideosInstantly,
  VideoClipInfo,
} from '../utils/instantVideoMerger';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(i >= 2 ? 2 : 0)} ${sizes[i]}`;
}

function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const totalSec = Math.round(sec);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export const VideoMergeStudio: React.FC = () => {
  const [clips, setClips] = useState<VideoClipInfo[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergeProgress, setMergeProgress] = useState<MergeProgressInfo | null>(null);
  const [mergeResult, setMergeResult] = useState<InstantMergeResult | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState<string>('DesiCrack_Merged_Video');
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const appendInputRef = useRef<HTMLInputElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Automatically run zero-copy Instant Merge whenever clips list changes
  useEffect(() => {
    let cancelled = false;

    if (clips.length === 0) {
      setMergeResult((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return null;
      });
      setMergeProgress(null);
      setMergeError(null);
      return;
    }

    const runInstantMerge = async () => {
      setIsMerging(true);
      setMergeError(null);
      let lastProgressUiTime = 0;
      try {
        const files = clips.map((c) => c.file);
        const result = await mergeVideosInstantly(files, 1.0, (prog) => {
          if (!cancelled) {
            const now = performance.now();
            if (prog.phase === 'completed' || prog.overallPercent >= 99 || now - lastProgressUiTime >= 75) {
              lastProgressUiTime = now;
              setMergeProgress(prog);
            }
          }
        });
        if (cancelled) {
          URL.revokeObjectURL(result.url);
          return;
        }
        setMergeResult((prev) => {
          if (prev?.url && prev.url !== result.url) {
            URL.revokeObjectURL(prev.url);
          }
          return result;
        });
      } catch (err: unknown) {
        if (!cancelled) {
          setMergeError(
            err instanceof Error ? err.message : 'Failed to merge selected video files.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsMerging(false);
        }
      }
    };

    runInstantMerge();

    return () => {
      cancelled = true;
    };
  }, [clips]);

  const handleFilesSelected = async (
    fileList: FileList | File[],
    mode: 'replace' | 'append'
  ) => {
    const rawFiles = Array.from(fileList).filter(
      (f) =>
        f.type.startsWith('video/') ||
        /\.(mp4|mov|m4v|webm|mkv|ts|m2ts|mts|avi)$/i.test(f.name)
    );
    if (rawFiles.length === 0) return;

    setIsMerging(true);
    const inspected = await Promise.all(rawFiles.map((f) => inspectVideoFile(f)));

    if (mode === 'replace') {
      setClips(inspected);
      const firstBase = inspected[0].name.replace(/\.[^.]+$/, '');
      setOutputFileName(`${firstBase}_Merged_${inspected.length}Clips`);
    } else {
      setClips((prev) => {
        const next = [...prev, ...inspected];
        const firstBase = next[0].name.replace(/\.[^.]+$/, '');
        setOutputFileName(`${firstBase}_Merged_${next.length}Clips`);
        return next;
      });
    }
  };

  const handleMoveClip = (index: number, direction: 'up' | 'down') => {
    setClips((prev) => {
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleRemoveClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearAll = () => {
    setClips([]);
  };

  const handleDownloadMergedVideo = () => {
    if (!mergeResult) return;
    const cleanName = (outputFileName || 'Merged_Video')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\.(mp4|webm|mov|ts|m2ts|mts|mkv)$/i, '');

    const finalFileName = `${cleanName}.mp4`;

    const a = document.createElement('a');
    a.href = mergeResult.url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleManualReMerge = async () => {
    if (clips.length === 0) return;
    setIsMerging(true);
    setMergeError(null);
    try {
      const result = await mergeVideosInstantly(
        clips.map((c) => c.file),
        1.0,
        (prog) => setMergeProgress(prog)
      );
      setMergeResult((prev) => {
        if (prev?.url && prev.url !== result.url) {
          URL.revokeObjectURL(prev.url);
        }
        return result;
      });
    } catch (err: unknown) {
      setMergeError(
        err instanceof Error ? err.message : 'Failed to merge selected video files.'
      );
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden Multiple Video File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,video/mp2t,.mp4,.mov,.m4v,.webm,.mkv,.ts,.m2ts,.mts"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files, 'replace');
            e.target.value = '';
          }
        }}
      />
      <input
        ref={appendInputRef}
        type="file"
        accept="video/*,video/mp2t,.mp4,.mov,.m4v,.webm,.mkv,.ts,.m2ts,.mts"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files, 'append');
            e.target.value = '';
          }
        }}
      />

      {/* Top Instant Video Merger Control Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 text-center">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
            Video Merger
          </h2>
        </div>

        {/* Empty State / Drag & Drop Zone */}
        {clips.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFilesSelected(e.dataTransfer.files, 'replace');
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
              isDraggingOver
                ? 'border-emerald-600 bg-emerald-50/70'
                : 'border-slate-300 hover:border-emerald-600 bg-slate-50/70 hover:bg-emerald-50/30'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Video className="w-7 h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Drag &amp; Drop Here
            </h3>
            <div className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-sm">
              <Upload className="w-4 h-4" />
              <span>Select Video</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Selected Video Clips Queue & Ordering */}
            <div className="lg:col-span-6 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Selected Videos ({clips.length} Clips)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => appendInputRef.current?.click()}
                    className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Add More</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {clips.map((clip, idx) => {
                  const isTsClip = clip.videoCodec === 'TS → MP4' || /\.(ts|m2ts|mts)$/i.test(clip.name);
                  const clipPct =
                    mergeProgress?.clipProgressByIndex?.[idx] ?? (mergeResult ? 100 : 0);
                  const clipDoneBytes = Math.round((clip.sizeBytes * clipPct) / 100);

                  return (
                    <div
                      key={clip.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                            <Film className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {clip.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 mt-0.5">
                              <span className="font-bold text-slate-700">
                                {formatBytes(clip.sizeBytes)}
                              </span>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">
                                {formatDuration(
                                  mergeResult?.clipDurationsSec?.[idx] || clip.durationSec
                                )}
                              </span>
                              {clip.width > 0 && clip.height > 0 && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {clip.width}×{clip.height}
                                  </span>
                                </>
                              )}
                              {isTsClip && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                    clipPct >= 100
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {clipPct >= 100
                                    ? '✓ TS → MP4 (100%)'
                                    : `TS → MP4 (${clipPct}%)`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveClip(idx, 'up')}
                            title="Move Up"
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === clips.length - 1}
                            onClick={() => handleMoveClip(idx, 'down')}
                            title="Move Down"
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveClip(clip.id)}
                            title="Remove Video"
                            className="p-1.5 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Per-clip .ts -> MP4 live conversion progress bar */}
                      {isTsClip && (
                        <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold text-slate-600">
                              {clipPct >= 100
                                ? '.ts → .mp4 Converted'
                                : 'Converting .ts → .mp4...'}
                            </span>
                            <span className="font-extrabold text-emerald-700">
                              {formatBytes(clipDoneBytes)} / {formatBytes(clip.sizeBytes)} ({clipPct}%)
                            </span>
                          </div>
                          <progress
                            value={clipPct}
                            max={100}
                            className="w-full h-1.5 rounded-full overflow-hidden accent-emerald-600"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Instant Merged Output Preview & Download */}
            <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-extrabold text-slate-900">
                      Merged Video Output
                    </span>
                  </div>

                  {mergeResult && !isMerging && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-extrabold">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      Merged in {mergeResult.elapsedMs} ms
                    </span>
                  )}
                </div>

                {/* Live .ts -> MP4 Conversion & Merge Progress Card */}
                {(isMerging || (mergeProgress && mergeProgress.tsTotalCount > 0)) && (
                  <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {isMerging
                            ? mergeProgress && mergeProgress.tsTotalCount > 0
                              ? `Converting .ts → MP4 (${mergeProgress.tsConvertedCount}/${mergeProgress.tsTotalCount} Done)`
                              : 'Merging Video Files...'
                            : mergeProgress && mergeProgress.tsTotalCount > 0
                              ? `✓ ${mergeProgress.tsTotalCount} .ts Video(s) Converted to MP4 & Merged`
                              : 'Merge Completed'}
                        </div>
                        {mergeProgress && (
                          <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                            {isMerging
                              ? `Clip ${mergeProgress.currentClipIndex}/${mergeProgress.totalClips}: ${mergeProgress.currentClipName} (${mergeProgress.currentClipPercent}%)`
                              : `${formatBytes(mergeProgress.processedBytes)} / ${formatBytes(mergeProgress.totalBytes)} Converted`}
                          </div>
                        )}
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-extrabold font-mono shrink-0">
                        {mergeProgress ? `${mergeProgress.overallPercent}%` : isMerging ? '0%' : '100%'}
                      </span>
                    </div>

                    <progress
                      value={mergeProgress ? mergeProgress.overallPercent : isMerging ? 5 : 100}
                      max={100}
                      className="w-full h-2.5 rounded-full overflow-hidden accent-emerald-600"
                    />

                    {mergeProgress && (
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                        <span className="font-bold text-emerald-800">
                          {formatBytes(mergeProgress.processedBytes)} / {formatBytes(mergeProgress.totalBytes)}
                        </span>
                        <span className="font-semibold">
                          {mergeProgress.tsTotalCount > 0
                            ? `${mergeProgress.tsConvertedCount} of ${mergeProgress.tsTotalCount} .ts → .mp4`
                            : `${mergeProgress.currentClipIndex} of ${mergeProgress.totalClips} clips`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {mergeError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                    {mergeError}
                  </div>
                )}

                {mergeResult && (
                  <>
                    <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-300 aspect-video flex items-center justify-center">
                      <video
                        ref={previewVideoRef}
                        key={mergeResult.url}
                        src={mergeResult.url}
                        controls
                        preload="metadata"
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Merged Stats Bar */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Total Clips
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                          {mergeResult.clipCount} Videos
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Duration
                        </div>
                        <div className="text-xs font-extrabold text-emerald-700 mt-0.5 font-mono">
                          {formatDuration(mergeResult.totalDurationSec)}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          Merged Size
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 mt-0.5 font-mono">
                          {formatBytes(mergeResult.totalSizeBytes)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Output File Name & Instant Download Button */}
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Merged Video File Name
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={outputFileName}
                      onChange={(e) => setOutputFileName(e.target.value)}
                      placeholder="DesiCrack_Merged_Video"
                      className="flex-1 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-700"
                    />
                    <span className="text-xs font-mono font-bold text-slate-500">
                      .mp4
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isMerging || clips.length === 0}
                    onClick={handleManualReMerge}
                    className="min-h-[42px] px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isMerging ? 'Merging...' : 'Instant Merge'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!mergeResult || isMerging}
                    onClick={handleDownloadMergedVideo}
                    className="flex-1 min-h-[42px] px-5 py-2.5 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Merged Video (.mp4)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
