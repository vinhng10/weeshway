import { auth } from "@/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import {
  createContext,
  use,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

const AuthContext = createContext<{
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
  isLoading: boolean;
}>({
  signIn: () => Promise.resolve(),
  signUp: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  user: null,
  isLoading: true,
});

// Use this hook to access the user info.
export function useAuth() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }

  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      setIsLoading(false);
    } catch (error) {
      setUser(null);
      setIsLoading(false);
      throw error; // Re-throw to allow the calling component to handle it
    }
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext
      value={{
        signIn,
        signUp,
        signOut,
        user,
        isLoading,
      }}
    >
      {children}
    </AuthContext>
  );
}
