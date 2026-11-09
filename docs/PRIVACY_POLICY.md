# Privacy Policy for Universal File Studio

**Last Updated:** November 9, 2026  
**Effective Date:** November 9, 2026  
**Application:** Universal File Studio (UFS)  
**Package Name:** `com.universalfilestudio.app`

---

## 1. Overview & Core Privacy Commitment

Universal File Studio ("we", "our", or "the app") is designed from the ground up as a **100% on-device, local-first multimedia conversion and document processing suite**. 

Our fundamental privacy principle is simple:
> **Your files, data, media, and documents never leave your device. We do not collect, transmit, store, or sell any of your personal information or file content.**

---

## 2. Information We Collect

### 2.1. File Content & Personal Data
* **Zero Collection:** We do not collect, read, analyze, or transmit your documents, videos, audio recordings, images, or archives to any remote server, cloud service, or third party.
* **Local Processing:** All conversions, transcodings, text extractions, OCR scans, encryptions, and archive compressions are executed entirely locally by the hardware and embedded native engines (`FFmpegKit`, `Tesseract 5`, `Apache PDFBox`, `Apache Commons Compress LZMA2`, and `WebAssembly`) inside your device sandbox.

### 2.2. Telemetry, Analytics, and Advertising
* **No Analytics:** The app does not embed Google Analytics, Firebase Analytics, Mixpanel, Sentry, or any telemetry tracking SDKs.
* **No Advertisements:** Universal File Studio is completely ad-free. No advertising identifiers (AAID/IDFA) are requested or read.
* **No User Accounts:** You do not need to register, provide an email address, create an account, or log in to use any feature of the application.

---

## 3. Device Permissions & How They Are Used

Universal File Studio requests only the minimal Android permissions necessary to perform user-initiated file transformations:

| Permission | Technical Name | Purpose |
| :--- | :--- | :--- |
| **Microphone** | `android.permission.RECORD_AUDIO` | Required exclusively when you use the in-app Voice & Microphone Recorder tool (`audio_record`) to capture offline voice memos. Audio recordings remain strictly on your local device. |
| **Media Storage** | `READ_MEDIA_IMAGES`<br>`READ_MEDIA_VIDEO`<br>`READ_MEDIA_AUDIO` | Required on modern Android devices to allow you to select your own photos, videos, or audio tracks from your device gallery to process. |
| **Foreground Service** | `FOREGROUND_SERVICE`<br>`FOREGROUND_SERVICE_MEDIA_PROCESSING` | Required to maintain continuous processing and prevent Android's battery optimizer (Doze Mode) from terminating long-running video or audio encoding tasks when the screen turns off. |
| **Wake Lock** | `android.permission.WAKE_LOCK` | Keeps the CPU active during active file rendering and compression operations, automatically released immediately upon task completion. |
| **Notifications** | `android.permission.POST_NOTIFICATIONS` | Displays real-time progress bars (e.g. "Encoding Video... 45%") in your notification shade so you know when your export is finished. |

---

## 4. Local Data Storage & Retention

* **Sandbox Storage:** Any temporary files created during processing (e.g., intermediate audio streams or extracted archive entries) are stored in the app's internal cache directory (`/data/user/0/com.universalfilestudio.app/cache/`).
* **Automatic Cleanup:** Temporary files are automatically purged when operations conclude or when you tap "Clear Completed" in the Job Queue.
* **Exported Files:** Files you choose to save are written to your public device Downloads folder (`/storage/emulated/0/Download/UniversalFileStudio/`) where you retain complete control over them.
* **Data Deletion:** Uninstalling the app permanently deletes all internal database records, job logs, and cached files from your device.

---

## 5. Third-Party Services & Links

Universal File Studio does not share your data with any third-party services. The app includes optional links to:
* **GitHub Repository:** For viewing the open-source code, reporting issues, or checking for software updates.
* Connecting to third-party external links is governed by the respective privacy policies of those services.

---

## 6. Children's Privacy (COPPA & GDPR-K Compliance)

Universal File Studio does not collect any personal information from any user, including children under the age of 13. The app is rated **PEGI 3 / Everyone** and is safe for use by users of all ages.

---

## 7. Security of Your Data

Because your data is never transmitted over the internet, your files are immune to cloud data breaches, man-in-the-middle network interception, and server-side leaks. You retain 100% ownership and sovereignty over your digital media.

---

## 8. Changes to This Privacy Policy

We may periodically update this policy to reflect new on-device features or regulatory standards. Any revisions will be reflected in the app repository with an updated effective date.

---

## 9. Contact Us

If you have questions, feedback, or security inquiries regarding this Privacy Policy, please open an issue on our GitHub repository:
* **Project Repository:** [https://github.com/universal-file-studio/universal-file-studio](https://github.com/universal-file-studio/universal-file-studio)
* **Author / Maintainer:** Universal File Studio Open Source Engineering Team
