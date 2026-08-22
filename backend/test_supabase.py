from app.services.supabase import (
    SUPABASE_URL,
    SUPABASE_KEY,
    get_problem_categories
)


print("Supabase URL loaded:", bool(SUPABASE_URL))
print("Supabase key loaded:", bool(SUPABASE_KEY))


categories = get_problem_categories()

print("Supabase connection successful!")
print("Problem categories:", categories)