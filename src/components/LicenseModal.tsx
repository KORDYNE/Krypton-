import React from 'react';
import { Shield, X, Scale } from 'lucide-react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-xl flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100 font-mono">
              Kordyne™ Community License Agreement (KCLA)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-slate-300 bg-slate-950/60 leading-relaxed space-y-4">
          <p className="font-bold text-cyan-300">
            Copyright (c) 2026 Kordyne™. Todos los derechos reservados.
          </p>
          <p>
            Se concede permiso, de forma gratuita, a cualquier persona para obtener una copia de este software y los archivos de documentación asociados (el "Software"), para utilizarlo con fines de auditoría defensiva personal, educación, investigación de privacidad y mejora de la seguridad propia, sujeto a las siguientes condiciones:
          </p>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded">
            <h4 className="font-bold text-rose-400 mb-1">
              1. Restricción de Uso Ofensivo y Malicioso (Defensive-Only Clause)
            </h4>
            <p className="text-slate-300">
              Queda estrictamente prohibido el uso, modificación, redistribución o integración de este Software (o de cualquier parte derivada del mismo) en actividades de naturaleza ofensiva, ciberdelictiva, de explotación no autorizada de sistemas, ataques de denegación de servicio, suplantación de identidad o cualquier práctica que viole la privacidad o integridad de terceros sin su consentimiento explícito y previo por escrito. Esta herramienta está diseñada exclusivamente para la defensa, el blindaje y el análisis de sistemas propios o autorizados.
            </p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded">
            <h4 className="font-bold text-slate-200 mb-1">
              2. Prohibición de Comercialización de Servicios Administrados (SaaS Malicioso)
            </h4>
            <p className="text-slate-400">
              No está permitido comercializar acceso al Software como un servicio gestionado de terceros, ni utilizarlo para sustentar operaciones de extracción de datos, recolección automatizada de credenciales o vulneración de perímetros de red ajenos.
            </p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded">
            <h4 className="font-bold text-slate-200 mb-1">
              3. Integridad de la Autoría y Sello
            </h4>
            <p className="text-slate-400">
              Cualquier copia o redistribución permitida del Software debe incluir de forma íntegra este aviso de licencia, los créditos de autoría originales y el sello de Kordyne™, sin alterar los mecanismos de marca de agua o telemetría de cumplimiento ético integrados.
            </p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded">
            <h4 className="font-bold text-slate-200 mb-1">
              4. Descargo de Responsabilidad ("AS IS")
            </h4>
            <p className="text-slate-400 uppercase text-[11px]">
              EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTÍA DE NINGÚN TIPO, EXPRESA O IMPLÍCITA. EN NINGÚN CASO LOS AUTORES O TITULARES DE LOS DERECHOS (KORDYNE™) SERÁN RESPONSABLES DE CUALQUIER RECLAMO, DAÑO U OTRA RESPONSABILIDAD, YA SEA EN UNA ACCIÓN DE CONTRATO, AGRAVIO O CUALQUIER OTRO MOTIVO, QUE SURJA DE O EN CONEXIÓN CON EL SOFTWARE O EL USO U OTROS TRATOS EN EL SOFTWARE.
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded transition-colors"
          >
            Entendido y Aceptar Condiciones
          </button>
        </div>
      </div>
    </div>
  );
};
