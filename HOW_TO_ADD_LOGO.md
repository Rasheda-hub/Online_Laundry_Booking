# How to Add Your Custom Logo

This guide shows you how to replace the default emoji logo (🧺) with your own custom logo.

## Step 1: Prepare Your Logo

### Recommended Specifications:
- **Format:** PNG (with transparent background) or SVG
- **Size:** 512x512px or 200x200px (square)
- **File name:** `logo.png` or `logo.svg`

### Tips:
- Use a transparent background for best results
- Keep it simple and recognizable at small sizes
- Test how it looks at different sizes (32px, 64px, 128px)

## Step 2: Add Logo to Project

1. Place your logo file in the `public` folder:
   ```
   LaundryApp3/
   └── frontend-react/
       └── public/
           └── logo.png    ← Put your logo here
   ```

2. The file will be accessible at `/logo.png` in your app

## Step 3: Update the Logo Component

Open `frontend-react/src/components/Logo.jsx` and make these changes:

### Current Code (using emoji):
```jsx
export default function Logo({ size = 'md', className = '' }) {
  // ... size definitions ...

  return (
    <div className={`inline-flex ${sizeClass} rounded-full bg-gradient-to-br from-bubble-dark to-bubble-mid items-center justify-center shadow-sm ${className}`}>
      {/* Option 1: Use emoji (default) */}
      <span className="text-2xl">🧺</span>
      
      {/* Option 2: Use custom logo image (uncomment and replace emoji above) */}
      {/* <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" /> */}
    </div>
  )
}
```

### Updated Code (using your logo):
```jsx
export default function Logo({ size = 'md', className = '' }) {
  // ... size definitions ...

  return (
    <div className={`inline-flex ${sizeClass} rounded-full bg-gradient-to-br from-bubble-dark to-bubble-mid items-center justify-center shadow-sm ${className}`}>
      {/* Use custom logo image */}
      <img src="/logo.png" alt="LaundryApp Logo" className="w-full h-full object-contain p-1" />
    </div>
  )
}
```

**Changes:**
1. Comment out or remove the emoji line
2. Uncomment the `<img>` tag
3. Update the `src` to match your logo filename

## Step 4: Update Favicon (Browser Tab Icon)

### Option A: Simple Favicon
1. Create or convert your logo to a 32x32px PNG
2. Name it `favicon.ico` or `favicon.png`
3. Place it in `frontend-react/public/`
4. Update `frontend-react/index.html`:
   ```html
   <link rel="icon" type="image/png" href="/favicon.png" />
   ```

### Option B: Multiple Sizes (Recommended)
Create multiple sizes for better display across devices:
```html
<!-- In frontend-react/index.html -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

## Step 5: Customize Background (Optional)

If you want to remove or change the circular gradient background:

### Remove Background:
```jsx
return (
  <div className={`inline-flex ${sizeClass} ${className}`}>
    <img src="/logo.png" alt="LaundryApp Logo" className="w-full h-full object-contain" />
  </div>
)
```

### Change Background Color:
```jsx
return (
  <div className={`inline-flex ${sizeClass} rounded-full bg-white items-center justify-center shadow-sm ${className}`}>
    <img src="/logo.png" alt="LaundryApp Logo" className="w-full h-full object-contain p-1" />
  </div>
)
```

## Where the Logo Appears

After updating, your logo will appear in:
- ✅ **Navigation header** (top of every page)
- ✅ **Login page** (large logo)
- ✅ **Register page** (if you add it there)
- ✅ **Browser tab** (favicon)

## Testing

1. Save your changes
2. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)
3. Check the logo appears correctly at different sizes
4. Test on mobile devices

## Troubleshooting

**Logo not showing?**
- Check the file path is correct (`/logo.png`)
- Make sure the file is in the `public` folder
- Clear browser cache and hard refresh
- Check browser console for errors

**Logo looks blurry?**
- Use a higher resolution image (512x512px)
- Use SVG format for crisp scaling
- Ensure the image has good contrast

**Logo too big/small?**
- Adjust the `p-1` padding in the `<img>` tag
- Use `p-2` for more padding, `p-0` for no padding

## Example Logo Files

Place these in `frontend-react/public/`:
```
public/
├── logo.png              (512x512px - main logo)
├── favicon.ico           (32x32px - browser tab)
├── favicon-16x16.png     (16x16px)
├── favicon-32x32.png     (32x32px)
└── apple-touch-icon.png  (180x180px - iOS)
```

## Need Help?

If you need to create different sizes of your logo:
- Use online tools like [Favicon Generator](https://favicon.io/)
- Use image editors like Photoshop, GIMP, or Figma
- Use online converters for PNG to ICO conversion
