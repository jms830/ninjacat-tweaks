# DOM Selectors Contract: NinjaCat Chat UX

**Last Updated**: 2025-12-02  
**Source**: Captured from live NinjaCat chat interface

## Chat Input Container

```html
<div class="min-w-[200px] max-w-[840px] w-[calc(100%-40px)] mx-[20px] mb-5">
  <div class="px-4 pt-3 w-full border rounded-3xl transition bg-white focus-within:border-blue-100 border-grey-30">
    <div class="flex items-center">
      <!-- Attach button (SVG) -->
      <!-- Textarea -->
      <!-- Send button -->
      <!-- Hidden file input -->
    </div>
  </div>
</div>
```

## Key Selectors

| Element | Selector | Notes |
|---------|----------|-------|
| **Chat textarea** | `#autoselect-experience` | Main input, placeholder shows agent name |
| **Input container** | `.min-w-\\[200px\\].max-w-\\[840px\\]` | Outer wrapper with sizing |
| **Input box** | `.border.rounded-3xl.bg-white` | The rounded input area |
| **Attach icon** | `.flex.items-center > svg` | Paperclip SVG for file attachment |
| **Send button** | `.rounded-full.w-\\[24px\\].h-\\[24px\\].bg-blue-5` | Blue circle with arrow |
| **File input** | `input[type="file"].hidden` | Hidden, already has `multiple=""` |

## File Input Details

```html
<input type="file" class="hidden" accept=".csv,.png,.jpg,.jpeg,.pdf,.txt,.md,.json" multiple="">
```

- **Already supports multiple files** via `multiple=""` attribute
- Accepted types: `.csv`, `.png`, `.jpg`, `.jpeg`, `.pdf`, `.txt`, `.md`, `.json`
- Hidden by default - triggered by clicking attach icon

## Chat Messages Container (TBD)

Need to capture selectors for:
- Messages container
- Individual message elements
- User messages vs agent messages
- Agent "thinking/running" indicator
- Error states

## Agent Running State (TBD)

Need to identify:
- How to detect when agent is processing
- Cancel button if it exists
- Input disabled state indicator

## Notes

1. The file input already supports multi-select - we just need drag-drop UI enhancement
2. Textarea has dynamic height (`style="overflow: hidden; height: 30px;"`)
3. Send button changes appearance based on input state
