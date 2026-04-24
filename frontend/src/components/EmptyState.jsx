import { Link } from "react-router-dom";
import Button from "./Button";

const EmptyState = ({ icon, title, description, actionTo, action, actionLabel }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
    <div className="text-6xl mb-4 opacity-40">{icon}</div>
    <h3 className="text-lg font-bold text-uber-black mb-1">{title}</h3>
    <p className="text-sm text-uber-gray-400 text-center max-w-md mb-6">{description}</p>
    {actionTo && (
      <Link to={actionTo}>
        <Button variant="primary">{actionLabel}</Button>
      </Link>
    )}
    {action && !actionTo && (
      <Button variant="secondary" onClick={action}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
