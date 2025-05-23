-- Add jsonb_to_vector function to convert JSON to vector
CREATE OR REPLACE FUNCTION public.jsonb_to_vector(embedding_json jsonb)
RETURNS vector
LANGUAGE plpgsql
AS $$
DECLARE
    vector_array float[];
    vector_result vector;
BEGIN
    -- Convert the jsonb array to a float array
    SELECT array_agg(x::float) INTO vector_array
    FROM jsonb_array_elements_text(embedding_json) x;
    
    -- Convert float array to vector
    vector_result = vector_array::vector;
    
    RETURN vector_result;
END;
$$;
