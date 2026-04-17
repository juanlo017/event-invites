export default function PrivacidadPage() {
  const company = 'Bulnes Eurogroup'
  const email = 'comunicacion@bulnesmba.com'
  const event = '70 Aniversario Bulnes Eurogroup'

  return (
    <main className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm px-8 py-10 space-y-8 text-stone-700">

        <div>
          <h1 className="text-2xl font-bold text-stone-800">Política de Privacidad</h1>
          <p className="text-stone-400 text-sm mt-1">Última actualización: abril de 2026</p>
        </div>

        <Section title="1. Responsable del tratamiento">
          <p>
            <strong>{company}</strong> es el responsable del tratamiento de los datos personales
            recogidos a través de este formulario de invitación al evento <em>{event}</em>.
          </p>
          <p className="mt-2">
            Contacto: <a href={`mailto:${email}`} className="text-stone-600 underline">{email}</a>
          </p>
        </Section>

        <Section title="2. Datos que recogemos">
          <p>Recogemos únicamente los datos necesarios para gestionar tu asistencia al evento:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Nombre completo</li>
            <li>Nombre del acompañante (opcional)</li>
            <li>Correo electrónico</li>
            <li>Confirmación de asistencia</li>
          </ul>
        </Section>

        <Section title="3. Finalidad del tratamiento">
          <p>
            Los datos se tratan exclusivamente para la gestión del evento: confirmar asistencia,
            enviar comunicaciones relacionadas con el evento y llevar el control de aforo.
            No se usan para ninguna otra finalidad comercial o publicitaria.
          </p>
        </Section>

        <Section title="4. Base legal">
          <p>
            El tratamiento se basa en el <strong>consentimiento expreso</strong> que prestas al
            marcar la casilla de aceptación en el formulario, de acuerdo con el artículo 6.1.a
            del Reglamento General de Protección de Datos (RGPD).
          </p>
        </Section>

        <Section title="5. Conservación de los datos">
          <p>
            Los datos se conservarán durante el tiempo necesario para la celebración del evento
            y hasta <strong>30 días después</strong> de su finalización, momento en el que serán
            eliminados de forma segura.
          </p>
        </Section>

        <Section title="6. Comunicación a terceros">
          <p>
            Los datos no se ceden ni comunican a terceros, salvo obligación legal. Se utilizan
            proveedores de infraestructura (Supabase para base de datos, Brevo para envío de email)
            que actúan como encargados del tratamiento con las garantías adecuadas del RGPD.
          </p>
        </Section>

        <Section title="7. Tus derechos">
          <p>Tienes derecho a:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li><strong>Acceso:</strong> conocer qué datos tenemos sobre ti.</li>
            <li><strong>Rectificación:</strong> corregir datos incorrectos.</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de tus datos.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
          </ul>
          <p className="mt-3">
            Para ejercer cualquiera de estos derechos, escríbenos a{' '}
            <a href={`mailto:${email}`} className="text-stone-600 underline">{email}</a>.
          </p>
          <p className="mt-2">
            También puedes presentar una reclamación ante la{' '}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer"
              className="text-stone-600 underline">
              Agencia Española de Protección de Datos (AEPD)
            </a>.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Esta web no utiliza cookies de seguimiento ni publicidad. Únicamente se usa
            el almacenamiento de sesión del navegador (<em>sessionStorage</em>) para mantener
            la sesión del panel de administración, que se elimina al cerrar el navegador.
          </p>
        </Section>

      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-stone-800 border-b border-stone-100 pb-1">{title}</h2>
      <div className="text-sm text-stone-600 leading-relaxed">{children}</div>
    </section>
  )
}
