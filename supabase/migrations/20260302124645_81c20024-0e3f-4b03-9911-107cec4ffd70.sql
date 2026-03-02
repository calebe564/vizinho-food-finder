
-- Users can delete their own highlight requests
CREATE POLICY "Users can delete own highlight requests"
ON public.highlight_requests
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own highlight requests (for replacing banner)
CREATE POLICY "Users can update own highlight requests"
ON public.highlight_requests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Unique constraint: one highlight per establishment
CREATE UNIQUE INDEX idx_highlight_unique_establishment 
ON public.highlight_requests (establishment_id) 
WHERE status IN ('pending', 'approved');
