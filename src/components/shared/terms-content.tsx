export function TermsContent() {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed text-foreground">
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">1. Objeto</h2>
        <p className="text-muted-foreground">
          Club Ciocolatto es el programa de fidelización de Ciocolatto. Al crear tu cuenta aceptás estos
          términos, que regulan cómo sumás puntos, subís de nivel y canjeás beneficios en nuestro local.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">2. Quién puede sumarse</h2>
        <p className="text-muted-foreground">
          Podés registrarte con un email y teléfono válidos, propios y no utilizados previamente en otra
          cuenta del Club. Cada persona puede tener una única cuenta.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">3. Puntos, niveles y misiones</h2>
        <p className="text-muted-foreground">
          Sumás puntos por tus compras y por completar misiones dentro de la app. Según tus puntos acumulados
          accedés a distintos niveles, cada uno con sus propios beneficios. Los puntos y niveles son
          personales, intransferibles y no tienen valor monetario ni pueden canjearse por dinero en efectivo.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">4. Canje de premios</h2>
        <p className="text-muted-foreground">
          Los premios disponibles y sus costos en puntos pueden variar según stock y promociones vigentes.
          El canje se confirma mostrando tu código QR o el código de canje en caja; una vez confirmado, los
          puntos utilizados no se reintegran.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">5. Regalo de cumpleaños</h2>
        <p className="text-muted-foreground">
          Si nos contás tu fecha de nacimiento, el día de tu cumpleaños te regalamos tu bebida favorita
          elegida al registrarte. El beneficio es personal, no acumulable y válido durante la semana de tu
          cumpleaños en nuestro local.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">6. Programa de referidos</h2>
        <p className="text-muted-foreground">
          Podés invitar amigos y familiares con tu código personal. No podés usar tu propio código para
          registrarte, y los puntos por referido se acreditan cuando la persona invitada realiza su primera
          compra.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">7. Tus datos personales</h2>
        <p className="text-muted-foreground">
          Usamos tu nombre, email, teléfono, fecha de nacimiento y bebida favorita únicamente para operar el
          programa de fidelización: identificarte en caja, calcular tus puntos y avisarte de tus beneficios.
          Si aceptaste recibir novedades, también te enviaremos promociones de Ciocolatto; podés darte de baja
          de esas comunicaciones cuando quieras desde tu perfil. No compartimos tus datos con terceros para
          fines distintos a los del programa.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">8. Cambios y baja</h2>
        <p className="text-muted-foreground">
          Podemos actualizar estos términos o los beneficios del programa para mejorarlo; los cambios rigen
          desde su publicación en la app. Podés dar de baja tu cuenta cuando quieras escribiéndonos a nuestro
          local.
        </p>
      </section>
    </div>
  );
}
