ALTER TABLE records ADD COLUMN subsidy_eligible INTEGER;  -- 1=可租補, 0=不可, NULL=不確定
ALTER TABLE records ADD COLUMN parking TEXT;              -- 有車位/租車位另計/無/NULL
