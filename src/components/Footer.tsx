export const Footer = () => {
  return (
    <footer className="border-t border-phindex-teal/20 lg:ml-80" style={{ backgroundColor: '#007a75' }}>
      <div className="container mx-auto px-4 py-3">
        <div className="text-center text-sm text-gray-300">
          © Copyright {new Date().getFullYear()} Phindex. All rights reserved.
        </div>
      </div>
    </footer>
  );
};