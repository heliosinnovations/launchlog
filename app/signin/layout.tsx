export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Hide the global header on sign-in page for a cleaner auth experience */}
      <style>{`
        header { display: none; }
      `}</style>
      {children}
    </>
  )
}
