import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_REACT_APP_SUPABASE_URL,
    import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY
);

const TABLE = 'concerts';

export const ConcertService = {
    async getAll() {
        const { data, error } = await supabase.from(TABLE).select('*');
        if (error) throw error;
        return data;
    },

    async insert(payload: any) {
        const { error } = await supabase.from(TABLE).insert([payload]);
        if (error) throw error;
    },

    async update(id: number, payload: any) {
        const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
        if (error) throw error;
    },

    async remove(id: number) {
        const { error } = await supabase.from(TABLE).delete().eq('id', id);
        if (error) throw error;
    },
};
