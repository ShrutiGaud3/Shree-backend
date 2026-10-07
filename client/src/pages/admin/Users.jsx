import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { apiError } from "../../api/client.js";
import { Badge, ErrorState, Loader } from "../../components/ui.jsx";

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const load = () => {
    setState("loading");
    api
      .get("/admin/users")
      .then(({ data }) => {
        setUsers(data || []);
        setState("done");
      })
      .catch((e) => {
        setError(apiError(e));
        setState("error");
      });
  };

  useEffect(load, []);

  const toggle = async (u, field) => {
    try {
      const { data } = await api.put(`/admin/users/${u._id}`, { [field]: !u[field] });
      setUsers(users.map((x) => (x._id === u._id ? data : x)));
      toast.success("User updated.");
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (state === "loading") return <Loader />;
  if (state === "error") return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-text">Users ({users.length})</h1>
      <div className="mt-4 space-y-2">
        {users.map((u) => (
          <div key={u._id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface p-3 shadow">
            <div className="flex-1 text-sm">
              <p className="font-bold text-text">{u.name} {u.isAdmin && <Badge>admin</Badge>}</p>
              <p className="text-text">{u.email} · {u.phone}</p>
              {!u.isActive && <Badge>inactive</Badge>} {u.isBlocked && <Badge>blocked</Badge>}
            </div>
            <button onClick={() => toggle(u, "isBlocked")} className="text-sm font-bold text-text underline">
              {u.isBlocked ? "Unblock" : "Block"}
            </button>
            <button onClick={() => toggle(u, "isActive")} className="text-sm font-bold text-text underline">
              {u.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersAdmin;
