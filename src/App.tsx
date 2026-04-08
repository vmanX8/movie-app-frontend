import { useEffect, useMemo, useState } from "react";
import $ from "jquery";

type Movie = {
    id: number;
    title: string;
    year: number;
};

type AuthState = {
    token: string;
    username: string;
} | null;

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:3000";

function App() {
    const [auth, setAuth] = useState<AuthState>(() => {
        const token = localStorage.getItem("movieAppToken");
        const username = localStorage.getItem("movieAppUser");
        return token && username ? { token, username } : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loginData, setLoginData] = useState({ username: "", pass: "" });
    const [movieForm, setMovieForm] = useState({ title: "", year: "" });
    const [isRegister, setIsRegister] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState("");
    const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        $("#app-root").addClass("jquery-ready");
    }, []);

    useEffect(() => {
        if (!auth) {
            setMovies([]);
            return;
        }

        const controller = new AbortController();
        const fetchMovies = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await fetch(`${apiBase}/movies`, {
                    headers: {
                        Authorization: `Bearer ${auth.token}`,
                    },
                    signal: controller.signal,
                });

                const data = await res.json();

                if (!res.ok) {
                    if (res.status === 401) {
                        logout();
                    }
                    throw new Error(data?.message || "Could not load movies");
                }

                setMovies(data.data || data || []);
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    setError((err as Error).message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
        return () => controller.abort();
    }, [auth, refresh]);

    const register = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setRegisterSuccess("");

        try {
            const res = await fetch(`${apiBase}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Registration failed");
            }

            setRegisterSuccess("Registration successful. Please log in.");
            setIsRegister(false);
            setLoginData({ username: "", pass: "" });
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const login = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setRegisterSuccess("");

        try {
            const res = await fetch(`${apiBase}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Login failed");
            }

            localStorage.setItem("movieAppToken", data.token);
            localStorage.setItem("movieAppUser", data.user.username);
            setAuth({ token: data.token, username: data.user.username });
            setLoginData({ username: "", pass: "" });
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("movieAppToken");
        localStorage.removeItem("movieAppUser");
        setAuth(null);
        setMovies([]);
        setError("");
    };

    const createMovie = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");

        if (!movieForm.title || !movieForm.year) {
            setError("Title and year are required.");
            return;
        }

        const year = Number(movieForm.year);
        if (isNaN(year) || year < 1850 || year > 3000) {
            setError("Please enter a valid movie date.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/movies`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth?.token}`,
                },
                body: JSON.stringify({ title: movieForm.title.trim(), year }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Could not create movie");
            }

            setMovieForm({ title: "", year: "" });
            setRefresh((prev) => prev + 1);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const updateMovie = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");

        if (!movieForm.title || !movieForm.year || !editingMovie) {
            setError("Title and year are required.");
            return;
        }

        const year = Number(movieForm.year);
        if (isNaN(year) || year < 1850 || year > 3000) {
            setError("Year must be a valid number between 1850 and 3000.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/movies/${editingMovie.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth?.token}`,
                },
                body: JSON.stringify({ title: movieForm.title.trim(), year }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Could not update movie");
            }

            setMovieForm({ title: "", year: "" });
            setEditingMovie(null);
            setRefresh((prev) => prev + 1);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (movie: Movie) => {
        setEditingMovie(movie);
        setMovieForm({ title: movie.title, year: movie.year.toString() });
    };

    const cancelEditing = () => {
        setEditingMovie(null);
        setMovieForm({ title: "", year: "" });
    };

    const deleteMovie = async (movieId: number) => {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/movies/${movieId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${auth?.token}`,
                },
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Could not delete movie");
            }

            setRefresh((prev) => prev + 1);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const headerText = useMemo(() => {
        return auth ? `Welcome back, ${auth.username}` : "Login to manage movies";
    }, [auth]);

    return (
        <div id="app-root" className="min-h-screen bg-slate-950 text-slate-100">
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-glow">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Movie App</p>
                            <h1 className="mt-2 text-3xl font-semibold text-white">My Movie Dashboard</h1>
                        </div>
                        {auth && (
                            <button
                                type="button"
                                onClick={logout}
                                className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
                            >
                                Logout
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                            {error}
                        </div>
                    )}

                    {!auth ? (
                        <form onSubmit={isRegister ? register : login} className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <label className="mb-2 block text-sm font-medium text-slate-300">Username</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRegister((prev) => !prev);
                                        setError("");
                                        setRegisterSuccess("");
                                    }}
                                    className="text-sm text-slate-400 transition hover:text-slate-100"
                                >
                                    {isRegister ? "Switch to login" : "Create account"}
                                </button>
                            </div>
                            <div>
                                <input
                                    value={loginData.username}
                                    onChange={(event) => setLoginData((prev) => ({ ...prev, username: event.target.value }))}
                                    className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-500"
                                    placeholder="admin"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                                <input
                                    type="password"
                                    value={loginData.pass}
                                    onChange={(event) => setLoginData((prev) => ({ ...prev, pass: event.target.value }))}
                                    className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            {registerSuccess && (
                                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                                    {registerSuccess}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-3xl bg-slate-100/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-100/20"
                            >
                                {loading ? (isRegister ? "Registering..." : "Logging in...") : isRegister ? "Register" : "Login"}
                            </button>
                        </form>
                    ) : (
                        <>
                            <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-base font-semibold text-white">{headerText}</p>
                                        <p className="mt-1 text-sm text-slate-500">Sign in and manage your movies with the backend API.</p>
                                    </div>
                                    <div className="rounded-full bg-slate-900 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-500">
                                        JWT Secured
                                    </div>
                                </div>

                                <form onSubmit={editingMovie ? updateMovie : createMovie} className="grid gap-4 sm:grid-cols-[1fr_auto]">
                                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                                        <input
                                            value={movieForm.title}
                                            onChange={(event) => setMovieForm((prev) => ({ ...prev, title: event.target.value }))}
                                            placeholder="Movie title"
                                            className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-500"
                                        />
                                        <input
                                            value={movieForm.year}
                                            onChange={(event) => setMovieForm((prev) => ({ ...prev, year: event.target.value }))}
                                            placeholder="Year (1850-3000)"
                                            inputMode="numeric"
                                            min="1850"
                                            max="3000"
                                            className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-500"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="rounded-3xl bg-slate-100/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-100/20"
                                        >
                                            {loading ? (editingMovie ? "Updating..." : "Saving...") : editingMovie ? "Update movie" : "Add movie"}
                                        </button>
                                        {editingMovie && (
                                            <button
                                                type="button"
                                                onClick={cancelEditing}
                                                className="rounded-3xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-700"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Movie list</h2>
                                        <p className="text-sm text-slate-500">Add or remove movies with your backend.</p>
                                    </div>
                                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.35em] text-slate-500">
                                        {movies.length} items
                                    </span>
                                </div>

                                {loading && <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-slate-400">Loading movies…</div>}
                                {!loading && movies.length === 0 && (
                                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-slate-400">No movies found yet.</div>
                                )}

                                <div className="grid gap-4">
                                    {movies.map((movie) => (
                                        <div
                                            key={movie.id}
                                            className="group flex flex-col justify-between rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-5 transition hover:bg-slate-900 sm:flex-row sm:items-center"
                                        >
                                            <div>
                                                <p className="text-sm text-slate-400">ID {movie.id}</p>
                                                <p className="mt-2 text-lg font-semibold text-white">{movie.title}</p>
                                                <p className="text-sm text-slate-500">{movie.year}</p>
                                            </div>
                                            <div className="mt-4 flex gap-2 sm:mt-0">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(movie)}
                                                    className="rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-200 transition hover:border-blue-300/60 hover:bg-blue-500/15"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteMovie(movie.id)}
                                                    className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-500/15"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;