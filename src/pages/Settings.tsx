import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Building, Users, Shield, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Configurações da unidade de saúde</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4" />
            Dados da Unidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Unidade</Label>
              <Input defaultValue="Hospital Josina Machel" />
            </div>
            <div className="space-y-2">
              <Label>Código SIGIS</Label>
              <Input defaultValue="HJM-001" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Província</Label>
              <Select defaultValue="Luanda">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Bengo","Benguela","Bié","Cabinda","Cuando Cubango","Cuanza Norte","Cuanza Sul","Cunene","Huambo","Huíla","Luanda","Lunda Norte","Lunda Sul","Malanje","Moxico","Namibe","Uíge","Zaire"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Município</Label>
              <Input defaultValue="Maianga" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Unidade</Label>
              <Select defaultValue="hospital">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospital">Hospital Provincial</SelectItem>
                  <SelectItem value="centro">Centro de Saúde</SelectItem>
                  <SelectItem value="posto">Posto de Saúde</SelectItem>
                  <SelectItem value="clinica">Clínica Privada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="sm">Guardar Alterações</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança & Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Logs de auditoria obrigatórios</p>
              <p className="text-xs text-muted-foreground">Registar todas as acções no sistema</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Versionamento de prontuários</p>
              <p className="text-xs text-muted-foreground">Manter histórico de todas as alterações</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Modo offline</p>
              <p className="text-xs text-muted-foreground">Armazenamento temporário local quando sem conexão</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}