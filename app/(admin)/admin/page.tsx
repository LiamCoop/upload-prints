import { redirect } from 'next/navigation';

export default function AdminHomePage() {
  // Redirect to inbox as the default admin page
  redirect('/admin/inbox');
}
