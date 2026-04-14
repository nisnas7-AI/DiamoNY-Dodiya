import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Loader2, Package, CheckCircle, Clock, XCircle, Search } from "lucide-react";
import { toast } from "sonner";

type StockStatus = "in_stock" | "made_to_order" | "out_of_stock";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  stock_status: StockStatus | null;
  is_customizable: boolean | null;
  main_image_url: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

const stockStatusLabels: Record<StockStatus, { label: string; icon: typeof CheckCircle; color: string }> = {
  in_stock: { label: "במלאי", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  made_to_order: { label: "ניתן להזמנה", icon: Clock, color: "bg-blue-100 text-blue-700" },
  out_of_stock: { label: "אזל", icon: XCircle, color: "bg-red-100 text-red-700" },
};

const InventoryManager = () => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  // Image fallback state - tracks images that failed to load
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    sku: "",
    stock_status: "made_to_order" as StockStatus,
    is_customizable: true,
  });
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, stock_status, is_customizable, main_image_url, category_id")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const updateInventory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("products")
        .update({
          sku: data.sku || null,
          stock_status: data.stock_status,
          is_customizable: data.is_customizable,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      toast.success("המלאי עודכן בהצלחה");
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה בעדכון המלאי");
    },
  });

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || "",
      stock_status: product.stock_status || "made_to_order",
      is_customizable: product.is_customizable ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateInventory.mutate({ id: editingProduct.id, data: formData });
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "-";
    return categories?.find((c) => c.id === categoryId)?.name || "-";
  };

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || product.stock_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stockCounts = {
    in_stock: products?.filter((p) => p.stock_status === "in_stock").length || 0,
    made_to_order: products?.filter((p) => p.stock_status === "made_to_order").length || 0,
    out_of_stock: products?.filter((p) => p.stock_status === "out_of_stock").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stockCounts.in_stock}</p>
                <p className="text-sm text-muted-foreground">במלאי</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stockCounts.made_to_order}</p>
                <p className="text-sm text-muted-foreground">להזמנה</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stockCounts.out_of_stock}</p>
                <p className="text-sm text-muted-foreground">אזל מהמלאי</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            ניהול מלאי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי שם או מק״ט..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="סינון לפי סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="in_stock">במלאי</SelectItem>
                <SelectItem value="made_to_order">להזמנה</SelectItem>
                <SelectItem value="out_of_stock">אזל</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !filteredProducts?.length ? (
            <p className="text-center text-muted-foreground py-8">
              לא נמצאו מוצרים
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">מוצר</TableHead>
                    <TableHead className="text-right">קטגוריה</TableHead>
                    <TableHead className="text-right">מק"ט</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-right">ניתן להתאמה</TableHead>
                    <TableHead className="text-right w-20">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const status = stockStatusLabels[product.stock_status || "made_to_order"];
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.main_image_url && !failedImages.has(product.id) ? (
                              <img
                                src={product.main_image_url}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                                onError={() => {
                                  setFailedImages(prev => new Set(prev).add(product.id));
                                  console.warn(`Image load failed for product: ${product.sku}`);
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center relative">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                {!product.main_image_url && (
                                  <span 
                                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full" 
                                    title="חסרה תמונה"
                                  />
                                )}
                              </div>
                            )}
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryName(product.category_id)}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {product.sku || "-"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.color} flex items-center gap-1 w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.is_customizable ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              כן
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              לא
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>עדכון מלאי - {editingProduct?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sku">מק"ט</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SKU-001"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_status">סטטוס מלאי</Label>
              <Select
                value={formData.stock_status}
                onValueChange={(value: StockStatus) => setFormData({ ...formData, stock_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      במלאי
                    </div>
                  </SelectItem>
                  <SelectItem value="made_to_order">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      ניתן להזמנה / עיצוב
                    </div>
                  </SelectItem>
                  <SelectItem value="out_of_stock">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      אזל מהמלאי
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_customizable">ניתן להתאמה אישית</Label>
              <Switch
                id="is_customizable"
                checked={formData.is_customizable}
                onCheckedChange={(checked) => setFormData({ ...formData, is_customizable: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={updateInventory.isPending}>
                {updateInventory.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                )}
                עדכן
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManager;
