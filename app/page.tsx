import { signOut } from "@/auth"

export default function Home() {
  return (
    <div>
      <form
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/user/signin" })
        }}
      >
        <button type="submit">logout</button>
      </form>
    </div>
  );
}
