import { authClient } from "./api";
import { useState } from "react";
import Subscriptions from "./Subscriptions";
  
export default function App() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  console.log(session);

  const signInStatus = isPending
    ? "Loading..."
    : session
    ? "Signed In"
    : "Signed Out";

  return (
    <div className="mx-auto max-w-xl w-full p-2">
      <h1 className="mb-4">Hello {session?.user?.name || "World"}</h1>
      {signInStatus === "Signed Out" && (
        <>
          <SignUpOrIn
            onSuccess={() => {
              console.log("signed up/in successfully");
            }}
          />
        </>
      )}
      {signInStatus === "Signed In" && <SignOutButton />}
      {/* TODO: add the SSO, probably replace the signIn and Up with one thing */}
      {/* ------ */}
      <div className="mt-4"></div>
      <Subscriptions />
    </div>
  );
}

function SignOutButton() {
  return (
    <button
      className="my-button"
      onClick={() => {
        authClient.signOut();
      }}
    >
      Sign Out
    </button>
  );
}
function SignUpOrIn(props: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function signUpEmail() {
    const { data, error } = await authClient.signUp.email(
      {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        // callbackUrl
      },
      {
        onRequest: (ctx) => {
          console.log("signing up", ctx);
        },
        onSuccess: (ctx) => {
          //redirect to the dashboard or sign in page
          console.log("signed up successfully", ctx);
          props.onSuccess();
        },
        onError: (ctx) => {
          console.log("error signing up", ctx);
        },
      }
    );
  }

  async function signInEmail() {
    const { data, error } = await authClient.signIn.email(
      {
        email: formData.email,
        password: formData.password,
        // callbackUrl // A URL to redirect to after the user verifies their email (optional)
      },
      {
        onRequest: (ctx) => {
          console.log("signing in", ctx);
        },
        onSuccess: (ctx) => {
          //redirect to the dashboard or sign in page
          console.log("signed in successfully", ctx);
          props.onSuccess();
        },
        onError: (ctx) => {
          console.log("error signing in", ctx);
        },
      }
    );
  }
  async function signInWithGitHub() {
    const { data, error } = await authClient.signIn.social(
      {
        provider: "github",
        callbackURL: "http://localhost:5173/test",
      },
      {
        onSuccess: (ctx) => {
          console.log("signed in with GitHub successfully", ctx);
          props.onSuccess();
        },
        onError: (ctx) => {
          console.log("error signing in with GitHub", ctx);
        },
      }
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      <input
        type="email"
        name="email"
        placeholder="Email"
        onChange={handleChange}
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
      />
      <div className="flex gap-2">
        <button className="my-button" type="submit" onClick={signUpEmail}>
          Sign Up
        </button>
        <button className="my-button" type="submit" onClick={signInEmail}>
          Sign In
        </button>
      </div>

      <button className="my-button" type="submit" onClick={signInWithGitHub}>
        Continue with GitHub
      </button>
    </form>
  );
}

