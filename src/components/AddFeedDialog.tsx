"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddFeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFeed: (feed: { url: string; name: string; category: string }) => void;
}

export function AddFeedDialog({ open, onOpenChange, onAddFeed }: AddFeedDialogProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("政府・官公庁");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && name) {
      onAddFeed({ url, name, category });
      setUrl("");
      setName("");
      setCategory("政府・官公庁");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新しいRSSフィードを追加</DialogTitle>
            <DialogDescription>
              政府機関や企業のRSSフィードURLを入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">RSS フィード URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/rss.xml"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">フィード名</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：経済産業省ニュース"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">カテゴリー</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="政府・官公庁">政府・官公庁</SelectItem>
                  <SelectItem value="企業">企業</SelectItem>
                  <SelectItem value="メディア">メディア</SelectItem>
                  <SelectItem value="国際機関">国際機関</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">追加</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}