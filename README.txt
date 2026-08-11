RAMNAD GADGETS - Premium Gadgets Store
======================================

📁 Structure (5 folders):
- css/       → style.css
- js/        → app.js
- data/      → all.json + category JSONs
- images/    → உன் product photos இங்கே போடு!
- icons/     → optional

========================================
🔥 IMAGE எப்படி ADD பண்றது? (முக்கியம்)
========================================

1. உன் photo files-ஐ  images/  folder-ல போடு
   Example: images/noise-watch.jpg , images/boat-earbuds.png

2. data/ folder-ல உள்ள JSON files-ஐ open பண்ணு (all.json, smartwatches.json etc)

3. "image" field-ல path மாத்து:

   Correct example:
   "image": "images/noise-watch.jpg"

   ❌ Wrong:
   "image": "noise-watch.jpg"
   "image": "/images/noise-watch.jpg"
   "image": "C:/Users/.../noise-watch.jpg"

4. Video வேணும்னா:
   "video": "images/product-video.mp4"
   (video இருந்தா image-க்கு பதிலா video play ஆகும்)

5. Save பண்ணிட்டு browser refresh பண்ணு

========================================
⚠️ IMPORTANT - Local Server தேவை
========================================

index.html-ஐ double-click பண்ணி திறந்தா products load ஆகாது (fetch fail).

Correct way:
1. Terminal open பண்ணு (folder-ல)
2. Run this command:
   python -m http.server 8000

3. Browser-ல open:
   http://localhost:8000

========================================

WhatsApp: +91 70924 27154

Products edit பண்ண JSON-ல name, price, original, desc, category change பண்ணலாம்.
