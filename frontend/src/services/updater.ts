import { Capacitor } from '@capacitor/core';
import { UniversalNativeEngine } from './nativeEngineBridge';

export const CURRENT_VERSION = '1.0.15';
export const GITHUB_REPO = 'AdityaPatra-dev/universal-file-studio';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  htmlUrl: string;
  downloadUrl?: string;
  assetName?: string;
  publishedAt?: string;
}

function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/, '').split('.').map(Number);
  const clean2 = v2.replace(/^v/, '').split('.').map(Number);
  const len = Math.max(clean1.length, clean2.length);

  for (let i = 0; i < len; i++) {
    const num1 = clean1[i] || 0;
    const num2 = clean2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export const updaterService = {
  getCurrentVersion(): string {
    return CURRENT_VERSION;
  },

  async checkForUpdates(): Promise<UpdateInfo> {
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!res.ok) {
        if (res.status === 404) {
          // No releases published yet
          return {
            hasUpdate: false,
            currentVersion: CURRENT_VERSION,
            latestVersion: CURRENT_VERSION,
            releaseNotes: 'No releases published yet on GitHub.',
            htmlUrl: `https://github.com/${GITHUB_REPO}/releases`,
          };
        }
        throw new Error(`GitHub API returned status ${res.status}`);
      }

      const release = await res.json();
      const latestTag = (release.tag_name || '1.0.0').replace(/^v/, '');
      const hasUpdate = compareVersions(latestTag, CURRENT_VERSION) > 0;

      // Select asset based on platform
      let downloadUrl = release.html_url;
      let assetName = '';

      if (release.assets && Array.isArray(release.assets)) {
        const isAndroid = Capacitor.getPlatform() === 'android';
        if (isAndroid) {
          // Prefer arm64-v8a split APK, fallback to universal
          const arm64 = release.assets.find((a: any) => a.name.includes('arm64-v8a') && a.name.endsWith('.apk'));
          const universal = release.assets.find((a: any) => a.name.includes('universal') && a.name.endsWith('.apk'));
          const anyApk = release.assets.find((a: any) => a.name.endsWith('.apk'));
          const chosen = arm64 || universal || anyApk;
          if (chosen) {
            downloadUrl = chosen.browser_download_url;
            assetName = chosen.name;
          }
        } else {
          // Desktop: windows, linux, macos
          const ua = navigator.userAgent.toLowerCase();
          let targetAsset;
          if (ua.includes('win')) {
            targetAsset = release.assets.find((a: any) => a.name.includes('Windows') && a.name.endsWith('.zip'));
          } else if (ua.includes('mac')) {
            targetAsset = release.assets.find((a: any) => a.name.includes('macOS'));
          } else {
            targetAsset = release.assets.find((a: any) => a.name.includes('Linux'));
          }
          if (targetAsset) {
            downloadUrl = targetAsset.browser_download_url;
            assetName = targetAsset.name;
          }
        }
      }

      return {
        hasUpdate,
        currentVersion: CURRENT_VERSION,
        latestVersion: latestTag,
        releaseNotes: release.body || 'New performance improvements and updates.',
        htmlUrl: release.html_url,
        downloadUrl,
        assetName,
        publishedAt: release.published_at,
      };
    } catch (err: any) {
      console.warn('Update check failed:', err.message);
      return {
        hasUpdate: false,
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        releaseNotes: '',
        htmlUrl: `https://github.com/${GITHUB_REPO}/releases`,
      };
    }
  },

  async installUpdate(downloadUrl: string): Promise<void> {
    if (Capacitor.getPlatform() === 'android') {
      try {
        await UniversalNativeEngine.downloadAndInstallApk({ url: downloadUrl });
      } catch (err: any) {
        console.error('Native APK install failed, falling back to browser download:', err);
        window.open(downloadUrl, '_system');
      }
    } else {
      window.open(downloadUrl, '_blank');
    }
  },
};

