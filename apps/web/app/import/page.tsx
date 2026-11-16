import { AppShell } from "../../components/AppShell";
import { PageHeader } from "../../components/primitives";
import { requireProfile } from "../../lib/queries";
import { ImportFlow } from "./ImportFlow";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const profile = await requireProfile();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Importar perfil"
        title="Trae tu perfil en segundos"
        lead="Leemos tu LinkedIn o tu hoja de vida, tú revisas lo que encontramos y solo se guarda lo que confirmes."
      />
      <ImportFlow profile={profile} />
    </AppShell>
  );
}
