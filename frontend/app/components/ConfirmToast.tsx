import { toast } from "sonner";

export function ConfirmToast(
  title: string,
  description: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div className="w-[380px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>

          <p className="mt-2 text-sm text-gray-600">{description}</p>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => {
                toast.dismiss(t);
                resolve(false);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                toast.dismiss(t);
                resolve(true);
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        dismissible: false,
      },
    );
  });
}
