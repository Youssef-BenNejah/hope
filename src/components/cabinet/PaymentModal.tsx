import { useState } from "react";
import { toast } from "sonner";
import { useCabinet } from "@/lib/cabinet/store";
import type { PaymentMethod } from "@/lib/cabinet/types";
import { Field, GhostButton, Modal, PrimaryButton, inputCls } from "./Modal";

export function PaymentModal({
  appointmentId,
  onClose,
}: {
  appointmentId: string | null;
  onClose: () => void;
}) {
  const { data, update, newId } = useCabinet();
  const appt = data.appointments.find((a) => a.id === appointmentId);
  const [amount, setAmount] = useState(40);
  const [method, setMethod] = useState<PaymentMethod>("cash");

  const confirm = () => {
    if (!appt) return;
    update((d) => ({
      ...d,
      appointments: d.appointments.map((a) => (a.id === appt.id ? { ...a, status: "done" } : a)),
      payments: [
        ...d.payments,
        { id: newId(), patientId: appt.patientId, date: appt.date, amount, method },
      ],
    }));
    toast.success(`Paiement enregistré — ${amount} DT`);
    onClose();
  };

  return (
    <Modal open={!!appt} onClose={onClose} title="Enregistrer le paiement" width="max-w-md">
      <div className="space-y-4">
        <Field label="Montant (DT)">
          <input
            type="number"
            className={`${inputCls} num`}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </Field>
        <Field label="Mode de règlement">
          <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            <option value="cash">Espèces</option>
            <option value="cnam_pending">CNAM en attente</option>
            <option value="cnam_paid">CNAM remboursé</option>
          </select>
        </Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <GhostButton onClick={onClose}>Annuler</GhostButton>
        <PrimaryButton onClick={confirm}>Valider la consultation</PrimaryButton>
      </div>
    </Modal>
  );
}
