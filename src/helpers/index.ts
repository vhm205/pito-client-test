export const fetchSession = async (supabase: any) => {
  const { data, error } = await supabase.auth.getSession();

  if (data) {
    return { data: data.session };
  }

  if (error) {
    return { error };
  }

  const response = await supabase.auth.refreshSession();
  if (response.error) {
    return response;
  }

  return { data: response.data?.session, response };
};
