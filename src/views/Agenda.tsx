"use client";
import { motion } from "motion/react";
import { MapPin, Video } from "lucide-react";
import { Avatar, Cabecalho, Vazio } from "@/components/bits";
import { hora, quando } from "@/lib/fmt";
import { useCRM } from "@/lib/store";
import { DIA } from "@/lib/types";
import { rectDe, useUI } from "@/lib/ui";

const inicioDia = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

export function Agenda() {
  const { leads } = useCRM();
  const { abrirFicha } = useUI();
  const hoje = inicioDia(Date.now());
  const dias = Array.from({ length: 7 }, (_, i) => hoje + i * DIA);
  const consultas = leads.filter((l) => l.consulta && l.consulta >= hoje && l.consulta < hoje + 7 * DIA).sort((a, b) => a.consulta! - b.consulta!);
  const semData = leads.filter((l) => l.etapa === "agendar" || (l.etapa === "agendado" && !l.consulta));

  return (
    <div>
      <Cabecalho eyebrow="Próximos 7 dias" titulo="Agenda">
        <span className="chip !text-[12.5px]">{consultas.length} consultas na semana</span>
      </Cabecalho>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        <div className="flex flex-col gap-3">
          {dias.map((d, i) => {
            const doDia = consultas.filter((l) => inicioDia(l.consulta!) === d);
            const nome = i === 0 ? "Hoje" : i === 1 ? "Amanhã" : new Date(d).toLocaleDateString("pt-BR", { weekday: "long" });
            const fds = [0, 6].includes(new Date(d).getDay());
            return (
              <motion.section key={d} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="panel p-4 grid sm:grid-cols-[120px_1fr] gap-3" style={{ opacity: fds && !doDia.length ? 0.6 : 1 }}>
                <div>
                  <div className="font-medium capitalize">{nome}</div>
                  <div className="text-[12px]" style={{ color: "var(--muted)" }}>{new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</div>
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  {doDia.length === 0 && <div className="text-[12.5px] py-1.5" style={{ color: "var(--faint)" }}>{fds ? "Clínica fechada" : "Sem consultas"}</div>}
                  {doDia.map((l) => (
                    <button key={l.id} type="button" onClick={(e) => abrirFicha(l.id, rectDe(e.currentTarget))}
                      className="flex items-center gap-3 rounded-xl p-2.5 text-left cursor-pointer hover:bg-[var(--surface-2)]" style={{ border: "1px solid var(--line)" }}>
                      <span className="num font-medium w-12 text-[15px]" style={{ color: "var(--gold-ink)" }}>{hora(l.consulta!)}</span>
                      <Avatar nome={l.nome} size={30} />
                      <span className="flex-1 min-w-0"><span className="block font-medium truncate">{l.nome}</span><span className="text-[12px]" style={{ color: "var(--muted)" }}>{l.interesse}</span></span>
                      <span className="chip">{l.modalidade === "Online" ? <Video size={12} /> : <MapPin size={12} />}{l.modalidade}</span>
                    </button>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
        <aside className="panel p-4 lg:sticky lg:top-4">
          <div className="eyebrow mb-1">Falta marcar a data</div>
          <p className="text-[12.5px] mt-0 mb-3" style={{ color: "var(--muted)" }}>Fecharam o protocolo e esperam um horário.</p>
          <div className="flex flex-col gap-2">
            {semData.map((l) => (
              <button key={l.id} type="button" onClick={(e) => abrirFicha(l.id, rectDe(e.currentTarget))} className="flex items-center gap-2.5 rounded-xl p-2 text-left cursor-pointer hover:bg-[var(--surface-2)]">
                <Avatar nome={l.nome} size={30} />
                <span className="flex-1 min-w-0"><span className="block truncate font-medium text-[13.5px]">{l.nome}</span><span className="text-[12px]" style={{ color: "var(--muted)" }}>Esperando {quando(l.mov).replace("há ", "há ")}</span></span>
                <span className="text-[12px] font-medium" style={{ color: "var(--gold-ink)" }}>Marcar</span>
              </button>
            ))}
            {semData.length === 0 && <Vazio>Todas com data marcada.</Vazio>}
          </div>
        </aside>
      </div>
    </div>
  );
}
