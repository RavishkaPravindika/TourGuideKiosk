# Fully Kiosk device test checklist

Do not treat a successful development server or desktop `file://` test as proof that the target tablet is compatible. Record the tablet model, Android version, Fully Kiosk version, date and test result for each item.

## Launch and navigation

- [ ] Copy the complete production `dist` output to the chosen tablet folder.
- [ ] Set Fully Kiosk Start URL to the actual local `file:///.../index.html` path.
- [ ] Confirm it opens after Fully Kiosk is closed and relaunched.
- [ ] Test landscape and portrait layouts, touch targets, scrolling and full-screen mode.
- [ ] Test guest language selection and all four guest languages.
- [ ] Test discover, area/category browse, destination detail, gallery, video, audio and My Trip routes.
- [ ] Confirm the hidden logo gesture opens the PIN screen and guest routes do not show admin records.

## IndexedDB and persistence

- [ ] Open Admin → Device diagnostics. Confirm JavaScript, IndexedDB, Dexie open, read/write, local media and file-input results.
- [ ] Treat the persistence canary as pending until it passes after a full app close/reopen.
- [ ] Create a draft destination and area; close Fully Kiosk completely and reopen the same local file.
- [ ] Confirm the draft and settings remain after relaunch.
- [ ] Restart the tablet and verify the same records again.
- [ ] If any storage check fails, stop before entering operational data; do not assume an in-memory fallback exists.

## Media and backup

- [ ] Import a real tablet photo and verify its thumbnail and destination gallery.
- [ ] Import and play a supported local MP4 using a tap; confirm there is no autoplay.
- [ ] Import audio and test playback.
- [ ] Close/reopen Fully Kiosk and verify the imported media still renders.
- [ ] Export a ZIP backup and confirm a non-empty ZIP exists in the configured downloads location.
- [ ] Restore that ZIP into a test installation or after a separate backup; confirm records and original media work.
- [ ] Test a corrupt ZIP and confirm restore fails without partially replacing existing records.
- [ ] Confirm the tablet has enough storage and that browser download restrictions are understood.

## Guest contacts, session and offline

- [ ] Submit a test international phone number with consent and confirm it appears only in Admin → Guest contacts.
- [ ] Verify the consent date and session ID; confirm saving does not send a WhatsApp message.
- [ ] Test the guide WhatsApp link and a guest chat link only when connectivity is available; confirm the user must manually send messages.
- [ ] Wait through the configured invitation interval and confirm the invitation appears only on a natural return to Discover, not during reading or video playback.
- [ ] End a guest session and confirm its trip list clears while contacts, destinations and media remain.
- [ ] Disable Wi-Fi and mobile data, then test browsing, local search, media, wishlist and admin editing.

## Record results

Do not describe Fully Kiosk persistence or offline behavior as verified until the checks above have passed on the actual tablet. Note any unavailable checks and the exact device/browser error in the admin diagnostics.
