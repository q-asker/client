const Maintenance = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
      <div className="mb-6 text-6xl">🔧</div>
      <h1 className="mb-3 text-[1.75rem] font-bold text-gray-900">서비스 점검 중입니다</h1>
      <p className="max-w-[480px] leading-relaxed text-gray-500">
        더 나은 서비스를 위해 시스템을 점검하고 있습니다.
        <br />
        빠른 시일 내에 다시 찾아뵙겠습니다.
      </p>
    </div>
  );
};

export default Maintenance;
