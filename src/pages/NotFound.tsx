import { Navigate } from 'react-router-dom';

/** The demo is a single page with hash routes; any other path goes back to the app. */
const NotFound = () => <Navigate to="/" replace />;

export default NotFound;
