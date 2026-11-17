# Installation guide

## Build on Windows

From the project directory, run:

```powershell
yarn install
yarn build
```

The self-contained application is `dist/index.html`. Keep the entire `dist` directory together because the favicon and diagnostic sample media are emitted beside it.

## Copy to Android

1. Copy the complete `dist` folder to a Fully Kiosk-accessible location on the tablet. For example, copy its contents to `TourApp` so the launch file is `TourApp/index.html`.
2. Confirm the final path in the Android file manager. Android scoped-storage rules differ by Android release and transfer method; do not assume `/sdcard` or a shared-storage path is accessible to Fully Kiosk.
3. In Fully Kiosk, set the Start URL to the verified local URL, for example `file:///storage/emulated/0/TourApp/index.html`.
4. Enable only the local-file access settings required by the installed Fully Kiosk version. Do not grant unrelated device permissions.
5. Configure the required screen orientation and full-screen/kiosk behavior in Fully Kiosk.
6. Launch the local file. Complete the first-run admin PIN setup and use the administrator diagnostics screen to inspect IndexedDB, media and file-input checks.
7. Test a saved record and media through a full Fully Kiosk close/reopen and tablet restart before relying on persistence.

Admin can be opened from the application logo by holding it briefly or tapping it five times in quick succession. A Fully Kiosk bookmark/shortcut can also be configured if supported by that installation, but its file URL must be tested on-device.

## Limitations

The application does not write uploaded media back into the physical app folder. Imported media and app records live in IndexedDB. Browser support for IndexedDB on `file://`, storage persistence, file pickers, downloads and video codecs varies; device diagnostics and a real tablet test are required. WhatsApp actions open an external app/browser and require connectivity and manual confirmation by the guest.

An administrator PIN prevents casual access only. Someone with full access to the device or local application storage may inspect or alter the database.
