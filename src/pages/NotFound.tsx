import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("Erro 404: Tentativa de acesso a rota inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7F9] p-4 font-inter">
      <div className="gov-card max-w-md w-full text-center p-8 border-t-4 border-t-[#D22B2B]">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100">
            <ShieldAlert className="h-10 w-10 text-[#D22B2B]" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-[#0A5C75] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Página Não Encontrada
        </h2>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          O recurso institucional ou documento clínico que procura não existe ou foi movido. Verifique o endereço e tente novamente.
        </p>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
          <Button asChild className="gov-button-primary w-full sm:w-auto">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Portal
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            República de Angola • Ministério da Saúde
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Sistema Integrado de Gestão Clínica (SIGC)
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
