import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
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
  Youtube as YoutubeIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Sparkles,
  Loader2,
  Table as TableIcon,
  Plus,
  Trash2,
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
} from '@/components/ui/dropdown-menu';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onAIGenerate?: (type: string, selectedText?: string) => Promise<string | null>;
  isAILoading?: boolean;
}

// Custom extension to strip inline styles on paste
// StarterKit already includes bold, italic, strike, etc.
// Explicitly disable link (we add our own) to prevent duplicate extension warnings
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

export const RichTextEditor = ({
  content,
  onChange,
  placeholder = "התחל לכתוב את התוכן שלך...",
  onAIGenerate,
  isAILoading = false,
}: RichTextEditorProps) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const editor = useEditor({
    extensions: [
      cleanPasteExtension,
      Underline,
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
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-lg my-4 mx-auto',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border my-4 w-full',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 bg-muted font-semibold',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none dark:prose-invert focus:outline-none min-h-[400px] p-4 rtl text-right',
        dir: 'rtl',
      },
      // Transform pasted content to strip inline styles
      transformPastedHTML(html) {
        // Create a temporary element to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Remove all inline styles
        const allElements = temp.querySelectorAll('*');
        allElements.forEach((el) => {
          el.removeAttribute('style');
          el.removeAttribute('class');
          // Keep only semantic attributes
          const allowedAttrs = ['href', 'src', 'alt', 'title', 'target', 'rel'];
          const attrs = Array.from(el.attributes);
          attrs.forEach((attr) => {
            if (!allowedAttrs.includes(attr.name)) {
              el.removeAttribute(attr.name);
            }
          });
        });

        // Convert font-size spans to proper headings (from Google Docs/Word)
        const spans = temp.querySelectorAll('span');
        spans.forEach((span) => {
          const parent = span.parentElement;
          if (parent && parent.tagName === 'P') {
            // Just unwrap the span, keeping the text
            const text = span.textContent || '';
            span.replaceWith(text);
          }
        });

        return temp.innerHTML;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Clean the HTML to ensure semantic output
      const cleanedHtml = cleanHtml(html);
      onChange(cleanedHtml);
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Clean HTML to remove any remaining inline styles
  const cleanHtml = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    const allElements = temp.querySelectorAll('*');
    allElements.forEach((el) => {
      el.removeAttribute('style');
      // Remove empty class attributes
      if (el.getAttribute('class') === '') {
        el.removeAttribute('class');
      }
    });
    
    return temp.innerHTML;
  };

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    
    if (editor.state.selection.empty) {
      // Insert link with URL as text
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run();
    } else {
      // Wrap selected text with link
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

  const insertYoutube = useCallback(() => {
    if (!editor || !youtubeUrl) return;
    
    editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
    
    setYoutubeUrl('');
    setYoutubeDialogOpen(false);
  }, [editor, youtubeUrl]);

  const handleAIAction = async (type: string) => {
    if (!onAIGenerate || !editor) return;
    
    const selectedText = editor.state.selection.empty 
      ? undefined 
      : editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to,
          ' '
        );
    
    const result = await onAIGenerate(type, selectedText);
    
    if (result) {
      if (type === 'article' || type === 'outline') {
        // Replace entire content
        editor.commands.setContent(result);
      } else if (type === 'improve' && selectedText) {
        // Replace selection
        editor.chain().focus().deleteSelection().insertContent(result).run();
      } else if (type === 'expand' && selectedText) {
        // Insert after selection
        editor.chain().focus().insertContent(result).run();
      } else if (type === 'intro') {
        // Insert at beginning
        editor.chain().focus().setTextSelection(0).insertContent(result + '<p></p>').run();
      } else if (type === 'conclusion') {
        // Insert at end
        editor.chain().focus().selectAll().setTextSelection(editor.state.doc.content.size).insertContent('<p></p>' + result).run();
      }
    }
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-[400px] border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        {/* Undo/Redo */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Text Formatting */}
        <Button
          size="icon"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
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
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="כותרת משנית (H2)"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="כותרת משנית (H3)"
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
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
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
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Horizontal Rule */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="קו מפריד"
        >
          <Minus className="h-4 w-4" />
        </Button>

        {/* Link Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant={editor.isActive('link') ? 'secondary' : 'ghost'}
              className="h-8 w-8"
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
                <Button onClick={insertLink} disabled={!linkUrl}>
                  הוסף קישור
                </Button>
                {editor.isActive('link') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setLinkDialogOpen(false);
                    }}
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
            <Button size="icon" variant="ghost" className="h-8 w-8">
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
              <Button onClick={insertImage} disabled={!imageUrl}>
                הוסף תמונה
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* YouTube Dialog */}
        <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <YoutubeIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוסף סרטון YouTube</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>קישור לסרטון</Label>
                <Input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  dir="ltr"
                />
              </div>
              <Button onClick={insertYoutube} disabled={!youtubeUrl}>
                הוסף סרטון
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="w-px h-8 bg-border mx-1" />

        {/* Table Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant={editor.isActive('table') ? 'secondary' : 'ghost'}
              className="h-8 w-8"
              title="טבלה"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            >
              <Plus className="h-4 w-4 ml-2" />
              הוסף טבלה 3×3
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()}
            >
              <Plus className="h-4 w-4 ml-2" />
              הוסף טבלה 4×4
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
            >
              הוסף עמודה מימין
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.can().addColumnBefore()}
            >
              הוסף עמודה משמאל
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
            >
              הוסף שורה מתחת
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.can().addRowBefore()}
            >
              הוסף שורה מעל
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              מחק עמודה
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              מחק שורה
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              מחק טבלה
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().mergeCells().run()}
              disabled={!editor.can().mergeCells()}
            >
              מזג תאים
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().splitCell().run()}
              disabled={!editor.can().splitCell()}
            >
              פצל תא
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              disabled={!editor.can().toggleHeaderRow()}
            >
              שורת כותרת
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-8 bg-border mx-1" />

        {/* AI Tools */}
        {onAIGenerate && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1"
                disabled={isAILoading}
              >
                {isAILoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI כתיבה
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAIAction('article')}>
                📝 כתוב מאמר מלא
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAIAction('outline')}>
                📋 צור מתווה מאמר
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleAIAction('improve')}
                disabled={editor.state.selection.empty}
              >
                ✨ שפר טקסט מסומן
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleAIAction('expand')}
                disabled={editor.state.selection.empty}
              >
                📖 הרחב טקסט מסומן
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAIAction('intro')}>
                🎬 צור פתיחה
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAIAction('conclusion')}>
                🏁 צור סיכום
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>


      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
