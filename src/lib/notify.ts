import { toast } from 'sonner';

export const notify = {
  success(message: string, title = 'Succès') {
    toast.success(title, { description: message });
  },
  error(message: string, title = 'Erreur') {
    toast.error(title, { description: message });
  },
  info(message: string, title = 'Information') {
    toast.info(title, { description: message });
  },
  warning(message: string, title = 'Attention') {
    toast.warning(title, { description: message });
  },
};
