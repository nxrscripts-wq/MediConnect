import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react'

export default function HumanResources() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  
  const nextWeek = () => {
    const next = new Date(currentWeek)
    next.setDate(next.getDate() + 7)
    setCurrentWeek(next)
  }

  const prevWeek = () => {
    const prev = new Date(currentWeek)
    prev.setDate(prev.getDate() - 7)
    setCurrentWeek(prev)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0A5C75]">Recursos Humanos</h1>
        <p className="text-muted-foreground mt-2">
          Gestão de escalas, presenças e ausências dos profissionais de saúde.
        </p>
      </div>

      <Tabs defaultValue="escala" className="w-full">
        <TabsList className="bg-white border rounded-none p-0 h-auto">
          <TabsTrigger value="escala" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0A5C75] px-6 py-3">Escala Semanal</TabsTrigger>
          <TabsTrigger value="ausencias" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0A5C75] px-6 py-3">Ausências</TabsTrigger>
          <TabsTrigger value="resumo" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0A5C75] px-6 py-3">Resumo Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="escala" className="mt-6">
          <Card className="gov-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Escala Semanal</CardTitle>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={prevWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Semana de {currentWeek.toLocaleDateString()}</span>
                <Button variant="outline" size="icon" onClick={nextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3 border-b">Profissional</th>
                      <th className="px-4 py-3 border-b">Segunda</th>
                      <th className="px-4 py-3 border-b">Terça</th>
                      <th className="px-4 py-3 border-b">Quarta</th>
                      <th className="px-4 py-3 border-b">Quinta</th>
                      <th className="px-4 py-3 border-b">Sexta</th>
                      <th className="px-4 py-3 border-b">Sábado</th>
                      <th className="px-4 py-3 border-b">Domingo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Placeholder content for demonstration */}
                    <tr className="border-b">
                      <td className="px-4 py-3 font-medium">Dr. João Silva</td>
                      <td className="px-2 py-2"><div className="bg-blue-100 text-blue-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Diurno</div></td>
                      <td className="px-2 py-2"><div className="bg-purple-100 text-purple-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Nocturno</div></td>
                      <td className="px-2 py-2"><div className="bg-green-100 text-green-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Folga</div></td>
                      <td className="px-2 py-2"><div className="bg-blue-100 text-blue-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Diurno</div></td>
                      <td className="px-2 py-2"><div className="bg-blue-100 text-blue-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Diurno</div></td>
                      <td className="px-2 py-2"><div className="bg-green-100 text-green-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Folga</div></td>
                      <td className="px-2 py-2"><div className="bg-green-100 text-green-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Folga</div></td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3 font-medium">Enf. Maria Gomes</td>
                      <td className="px-2 py-2"><div className="bg-amber-100 text-amber-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Plantão 12h</div></td>
                      <td className="px-2 py-2"><div className="bg-green-100 text-green-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Folga</div></td>
                      <td className="px-2 py-2"><div className="bg-amber-100 text-amber-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Plantão 12h</div></td>
                      <td className="px-2 py-2"><div className="bg-green-100 text-green-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Folga</div></td>
                      <td className="px-2 py-2"><div className="bg-teal-100 text-teal-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Férias</div></td>
                      <td className="px-2 py-2"><div className="bg-teal-100 text-teal-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Férias</div></td>
                      <td className="px-2 py-2"><div className="bg-teal-100 text-teal-800 text-center rounded py-1 text-xs font-semibold cursor-pointer">Férias</div></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ausencias" className="mt-6">
          <Card className="gov-card">
            <CardHeader>
              <CardTitle>Gestão de Ausências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Funcionário</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Período</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium text-right">Acções</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3">Enf. Maria Gomes</td>
                      <td className="px-4 py-3">Férias</td>
                      <td className="px-4 py-3">15/06/2026 - 30/06/2026</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                          Pendente
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <XCircle className="w-4 h-4 mr-1" /> Recusar
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumo" className="mt-6">
          <Card className="gov-card">
            <CardHeader>
              <CardTitle>Resumo Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Funcionário</th>
                      <th className="px-4 py-3 font-medium text-center">Dias Trabalhados</th>
                      <th className="px-4 py-3 font-medium text-center">Faltas</th>
                      <th className="px-4 py-3 font-medium text-center">Férias</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3">Dr. João Silva</td>
                      <td className="px-4 py-3 text-center">20</td>
                      <td className="px-4 py-3 text-center">0</td>
                      <td className="px-4 py-3 text-center">0</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-4 py-3">Enf. Maria Gomes</td>
                      <td className="px-4 py-3 text-center">15</td>
                      <td className="px-4 py-3 text-center text-red-600 font-semibold">2</td>
                      <td className="px-4 py-3 text-center">5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
