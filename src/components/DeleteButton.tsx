'use client';

export default function DeleteButton() {
  return (
    <button
      type="submit"
      className="btn small danger"
      onClick={(e) => {
        if (!confirm('Delete this record?')) e.preventDefault();
      }}
    >
      Delete
    </button>
  );
}
