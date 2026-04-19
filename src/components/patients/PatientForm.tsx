import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, User, MapPin, Phone, Activity, HeartPulse } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion'
import { CreatePatientInput } from '@/types/patient'
<<<<<<< HEAD
import { useProvinces, useMunicipalities } from '@/hooks/useLocations'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
=======
>>>>>>> bef739d (02)

const patientSchema = z.object({
    full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    date_of_birth: z.string().refine(val => {
        const date = new Date(val)
        return date <= new Date() && date >= new Date('1900-01-01')
    }, 'Data de nascimento inválida'),
    gender: z.enum(['masculino', 'feminino']),
    national_id: z.string().min(10).max(20).optional().or(z.literal('')),
    phone: z.string().regex(/^[+0-9\s\-()]{7,20}$/, 'Telefone inválido').optional().or(z.literal('')),
    province: z.string().min(1, 'Seleccione uma província'),
    municipality: z.string().min(2, 'Município obrigatório'),
    neighborhood: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'desconhecido']).optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    allergies: z.string().optional().or(z.literal('')),
    chronic_conditions: z.string().optional().or(z.literal('')),
    emergency_contact_name: z.string().optional().or(z.literal('')),
    emergency_contact_phone: z.string().optional().or(z.literal('')),
    emergency_contact_relation: z.string().optional().or(z.literal('')),
    notes: z.string().max(500).optional().or(z.literal('')),
})

type FormData = z.infer<typeof patientSchema>

interface PatientFormProps {
    initialData?: any
    onSubmit: (data: any) => void
    onCancel: () => void
    isLoading: boolean
}

<<<<<<< HEAD
// Geographic constants removed in favor of database fetching
=======
const provinces = [
    "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", "Cuanza Norte",
    "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte",
    "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"
]
>>>>>>> bef739d (02)

export function PatientForm({ initialData, onSubmit, onCancel, isLoading }: PatientFormProps) {
    const form = useForm<FormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            full_name: initialData?.full_name || '',
            date_of_birth: initialData?.date_of_birth || '',
            gender: initialData?.gender || 'masculino',
            national_id: initialData?.national_id || '',
            phone: initialData?.phone || '',
            province: initialData?.province || '',
            municipality: initialData?.municipality || '',
            neighborhood: initialData?.neighborhood || '',
            address: initialData?.address || '',
            blood_type: initialData?.blood_type || 'desconhecido',
            email: initialData?.email || '',
            allergies: initialData?.allergies?.join(', ') || '',
            chronic_conditions: initialData?.chronic_conditions?.join(', ') || '',
            emergency_contact_name: initialData?.emergency_contact_name || '',
            emergency_contact_phone: initialData?.emergency_contact_phone || '',
            emergency_contact_relation: initialData?.emergency_contact_relation || '',
            notes: initialData?.notes || '',
        },
    })

<<<<<<< HEAD
    const { data: provinceList = [] } = useProvinces()
    const selectedProvince = form.watch('province')
    const { data: municipalityList = [], isLoading: isLoadingMunicipalities } = useMunicipalities(selectedProvince)

    // Clear municipality when province changes
    useEffect(() => {
        if (selectedProvince && initialData?.province !== selectedProvince) {
            form.setValue('municipality', '')
        }
    }, [selectedProvince, form, initialData?.province])

=======
>>>>>>> bef739d (02)
    const handleSubmit = (values: FormData) => {
        const formattedData = {
            ...values,
            allergies: values.allergies ? values.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
            chronic_conditions: values.chronic_conditions ? values.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        }
        onSubmit(formattedData)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Section 1: Personal Data */}
                <div className="space-y-4">
<<<<<<< HEAD
                    <div className="flex items-center gap-2 text-primary font-bold text-xs md:text-sm border-b pb-1">
                        <User className="h-3.5 w-3.5 md:h-4 md:w-4" /> Dados Pessoais
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
=======
                    <div className="flex items-center gap-2 text-primary font-bold text-sm border-b pb-1">
                        <User className="h-4 w-4" /> Dados Pessoais
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
>>>>>>> bef739d (02)
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome Completo</FormLabel>
                                    <FormControl><Input placeholder="Ex: Manuel António" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="national_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nº do BI</FormLabel>
                                    <FormControl><Input placeholder="000000000LA000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
<<<<<<< HEAD
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
=======
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
>>>>>>> bef739d (02)
                        <FormField
                            control={form.control}
                            name="date_of_birth"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data de Nascimento</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Género</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="masculino">Masculino</SelectItem>
                                            <SelectItem value="feminino">Feminino</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone</FormLabel>
                                    <FormControl><Input placeholder="+244 9..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
<<<<<<< HEAD
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
=======
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
>>>>>>> bef739d (02)
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-mail (opcional)</FormLabel>
                                    <FormControl><Input placeholder="email@exemplo.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="blood_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo Sanguíneo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'desconhecido'].map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Section 2: Location */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm border-b pb-1">
                        <MapPin className="h-4 w-4" /> Localização
                    </div>
<<<<<<< HEAD
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
=======
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
>>>>>>> bef739d (02)
                        <FormField
                            control={form.control}
                            name="province"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Província</FormLabel>
<<<<<<< HEAD
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Província" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {provinceList.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
=======
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Província" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
>>>>>>> bef739d (02)
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="municipality"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Município</FormLabel>
<<<<<<< HEAD
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                        disabled={!selectedProvince || isLoadingMunicipalities}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isLoadingMunicipalities ? "A carregar..." : "Município"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {municipalityList.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
=======
                                    <FormControl><Input placeholder="Ex: Luanda" {...field} /></FormControl>
>>>>>>> bef739d (02)
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="neighborhood"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bairro</FormLabel>
                                    <FormControl><Input placeholder="Ex: Alvalade" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Endereço Completo</FormLabel>
                                <FormControl><Textarea className="h-20 resize-none" placeholder="Rua, casa nº..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Section 3: Emergency */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="emergency" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-0 border-b pb-1">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                <Phone className="h-4 w-4" /> Contacto de Emergência
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
<<<<<<< HEAD
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
=======
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
>>>>>>> bef739d (02)
                                <FormField
                                    control={form.control}
                                    name="emergency_contact_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do Contacto</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="emergency_contact_phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="emergency_contact_relation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Parentesco / Relação</FormLabel>
                                            <FormControl><Input placeholder="Ex: Pai, Cônjuge" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Section 4: Clinical */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm border-b pb-1">
                        <HeartPulse className="h-4 w-4" /> Informação Clínica
                    </div>
                    <FormField
                        control={form.control}
                        name="allergies"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Alergias (separadas por vírgula)</FormLabel>
                                <FormControl><Input placeholder="Ex: Penicilina, Amendoim" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="chronic_conditions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Condições Crónicas (separadas por vírgula)</FormLabel>
                                <FormControl><Input placeholder="Ex: Hipertensão, Diabetes" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Observações Gerais</FormLabel>
                                <FormControl><Textarea className="h-24 resize-none" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

<<<<<<< HEAD
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="order-2 sm:order-1">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="min-w-[150px] order-1 sm:order-2">
=======
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="min-w-[150px]">
>>>>>>> bef739d (02)
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                A guardar...
                            </>
                        ) : initialData ? 'Guardar Alterações' : 'Registar Paciente'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
