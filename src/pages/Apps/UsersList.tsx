import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_REACT_APP_SUPABASE_URL,
  import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY
);

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  dob: string;
  address: string;
  phone: string;
};

const PER_PAGE = 10;

const UserProfilesTable = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProfiles, setTotalProfiles] = useState(0);

  useEffect(() => {
    fetchProfiles();
    fetchTotalCount();
  }, [currentPage]);

  const fetchProfiles = async () => {
    setLoading(true);
    const from = (currentPage - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, dob, address, phone')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error) setProfiles(data || []);
    setLoading(false);
  };

  const fetchTotalCount = async () => {
    const { count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (count !== null) setTotalProfiles(count);
  };

  const totalPages = Math.ceil(totalProfiles / PER_PAGE);

  const filtered = profiles.filter(profile =>
    `${profile.first_name} ${profile.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">User Profiles</h2>
      <input
        type="text"
        className="form-input mb-4 w-full"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading profiles...</p>
      ) : (
        <>
          <table className="table table-striped w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>{p.first_name} {p.last_name}</td>
                  <td>{p.email}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div className="flex justify-between mt-4">
            <button
              className="btn btn-primary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button>
            <span className="self-center">Page {currentPage} of {totalPages}</span>
            <button
              className="btn btn-primary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfilesTable;
