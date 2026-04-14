import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Loader2,
  Type,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface BrandRichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

// Brand color palette based on design system
const BRAND_COLORS = [
  { name: 'זהב נגיש', value: '#856404', label: 'Accessible Gold' },
  { name: 'זהב יוקרה', value: '#D4AF37', label: 'Luxury Gold' },
  { name: 'טקסט ראשי', value: '#2D2D2D', label: 'Primary Text' },
  { name: 'טקסט משני', value: '#595959', label: 'Secondary Text' },
  { name: 'שחור עמוק', value: '#1A1A1A', label: 'Deep Black' },
  { name: 'לבן', value: '#FFFFFF', label: 'White' },
  { name: 'רקע בהיר', value: '#F9F9F9', label: 'Light Background' },
  { name: 'רקע כהה', value: '#121212', label: 'Dark Background' },
];

// Font family options
const FONT_FAMILIES = [
  { name: 'גופן כותרות (Playfair)', value: 'Playfair Display, serif' },
  { name: 'גופן גוף (Lato)', value: 'Lato, sans-serif' },
  { name: 'גופן עברי (Assistant)', value: 'Assistant, sans-serif' },
];

// Custom extension to strip inline styles on paste
const cleanPasteExtension = StarterKit.configure({
  heading: {
    levels: [1, 2, 3],
  },
  paragraph: {},
  bold: {},
  italic: {},
  strike: {},
  bulletList: {},
  orderedList: {},
  blockquote: {},
  horizontalRule: {},
  hardBreak: {},
  codeBlock: false,
  code: false,
});

export const BrandRichTextEditor = ({
  content,
  onChange,
  placeholder = "התחל לכתוב...",
  minHeight = "200px",
}: BrandRichTextEditorProps) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const editor = useEditor({
    extensions: [
      cleanPasteExtension,
      Underline,
      TextStyle,
      Color,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose prose-lg max-w-none dark:prose-invert focus:outline-none p-4 rtl text-right`,
        style: `min-height: ${minHeight}`,
        dir: 'rtl',
      },
      // Transform pasted content to strip inline styles
      transformPastedHTML(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        const allElements = temp.querySelectorAll('*');
        allElements.forEach((el) => {
          el.removeAttribute('style');
          el.removeAttribute('class');
          const allowedAttrs = ['href', 'src', 'alt', 'title', 'target', 'rel'];
          const attrs = Array.from(el.attributes);
          attrs.forEach((attr) => {
            if (!allowedAttrs.includes(attr.name)) {
              el.removeAttribute(attr.name);
            }
          });
        });

        return temp.innerHTML;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    
    setLinkUrl('');
    setLinkDialogOpen(false);
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    
    editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
    
    setImageUrl('');
    setImageAlt('');
    setImageDialogOpen(false);
  }, [editor, imageUrl, imageAlt]);

  const setTextColor = (color: string) => {
    editor?.chain().focus().setColor(color).run();
  };

  const setFontFamily = (fontFamily: string) => {
    editor?.chain().focus().setMark('textStyle', { fontFamily }).run();
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center border rounded-lg" style={{ minHeight }}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        {/* Undo/Redo */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          type="button"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          type="button"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Font Family Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 gap-1 px-2" type="button">
              <Type className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">גופן</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>בחר גופן</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {FONT_FAMILIES.map((font) => (
              <DropdownMenuItem
                key={font.value}
                onClick={() => setFontFamily(font.value)}
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Color Palette Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8" type="button">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="text-xs font-medium text-muted-foreground mb-2">צבעי המותג</div>
            <div className="grid grid-cols-4 gap-1">
              {BRAND_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setTextColor(color.value)}
                  className="w-8 h-8 rounded-md border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  type="button"
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Text Formatting */}
        <Button
          size="icon"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          type="button"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Headings */}
        <Button
          size="icon"
          variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="כותרת ראשית (H1)"
          type="button"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="כותרת משנית (H2)"
          type="button"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="כותרת משנית (H3)"
          type="button"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Lists */}
        <Button
          size="icon"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          type="button"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Alignment */}
        <Button
          size="icon"
          variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          type="button"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          type="button"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          type="button"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Link Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant={editor.isActive('link') ? 'secondary' : 'ghost'}
              className="h-8 w-8"
              type="button"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוסף קישור</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>כתובת URL</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={insertLink} disabled={!linkUrl} type="button">
                  הוסף קישור
                </Button>
                {editor.isActive('link') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setLinkDialogOpen(false);
                    }}
                    type="button"
                  >
                    הסר קישור
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8" type="button">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוסף תמונה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>כתובת תמונה</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>תיאור (alt)</Label>
                <Input
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="תיאור התמונה לנגישות ו-SEO"
                />
              </div>
              <Button onClick={insertImage} disabled={!imageUrl} type="button">
                הוסף תמונה
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default BrandRichTextEditor;
