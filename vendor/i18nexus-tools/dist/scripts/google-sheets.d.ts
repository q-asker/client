export interface GoogleSheetsConfig {
    credentialsPath?: string;
    spreadsheetId?: string;
    sheetName?: string;
    namespace?: string;
    keyColumn?: string;
    valueColumns?: string[];
    headerRow?: number;
}
export interface TranslationRow {
    key: string;
    [language: string]: string;
}
export declare class GoogleSheetsManager {
    private sheets;
    private config;
    constructor(config?: Partial<GoogleSheetsConfig>);
    /**
     * 네임스페이스 경로 반환 (도메인 우선 구조: locales/[namespace]/[lang].json)
     */
    private getNamespacePath;
    /**
     * Google Sheets API 인증 및 초기화
     */
    authenticate(): Promise<void>;
    /**
     * 스프레드시트가 존재하는지 확인
     */
    checkSpreadsheet(): Promise<boolean>;
    /**
     * 워크시트가 존재하는지 확인하고, 없으면 생성
     */
    ensureWorksheet(): Promise<void>;
    /**
     * 헤더 행 추가
     */
    private addHeaders;
    /**
     * 로컬 번역 파일들을 읽어서 Google Sheets에 업로드
     * @param localesDir 로컬 번역 파일 디렉토리
     * @param autoTranslate true일 경우 영어는 GOOGLETRANSLATE 수식으로 업로드
     * @param force true일 경우 기존 데이터를 모두 지우고 새로 업로드
     */
    uploadTranslations(localesDir: string, autoTranslate?: boolean, force?: boolean): Promise<void>;
    /**
     * Google Sheets에서 번역 데이터 다운로드
     * valueRenderOption을 FORMATTED_VALUE로 설정하여 수식이 아닌 계산된 결과값을 가져옴
     */
    downloadTranslations(): Promise<TranslationRow[]>;
    /**
     * Google Sheets 데이터를 로컬 번역 파일로 저장 (언어별 파일: en.json, ko.json)
     */
    saveTranslationsToLocal(localesDir: string, languages?: string[]): Promise<void>;
    /**
     * Google Sheets 데이터를 로컬 번역 파일로 저장 (증분 업데이트 - 추가된 데이터만)
     */
    saveTranslationsToLocalIncremental(localesDir: string, languages?: string[]): Promise<void>;
    /**
     * 로컬 번역 파일들 읽기
     * - namespace가 없으면: locales/en.json, locales/ko.json (레거시)
     * - namespace가 있으면: locales/${namespace}/en.json, locales/${namespace}/ko.json (도메인 우선)
     */
    readLocalTranslations(localesDir: string): Promise<TranslationRow[]>;
    /**
     * 양방향 동기화 - 로컬과 Google Sheets 간의 차이점 해결
     */
    syncTranslations(localesDir: string): Promise<void>;
    /**
     * Google Sheets에서 수식/날짜/시간으로 해석되는 값 방지
     *
     * 처리되는 패턴:
     * 1. 수식으로 오인될 수 있는 시작 문자: =, +, -, @
     * 2. 날짜/시간으로 자동 변환되는 패턴:
     *    - 1-2, 3/4, 5.6 (날짜로 변환)
     *    - 12:30 (시간으로 변환)
     *    - 2025/12/2 (날짜로 변환)
     * 3. 숫자와 연산자 조합: "1 + 1", "2-3" 등
     * 4. 괄호로 시작: (제목 없음), (1+2) 등
     *
     * 모든 위험한 패턴 앞에 '를 추가하여 텍스트로 강제 변환
     */
    private escapeFormula;
    /**
     * 새로운 번역들을 Google Sheets에 추가
     */
    private uploadNewTranslations;
    /**
     * 새로운 번역들을 로컬 파일에 추가
     */
    private addTranslationsToLocal;
    /**
     * Spreadsheet의 모든 시트 목록 조회
     */
    getAllSheetNames(): Promise<string[]>;
    /**
     * 모든 시트의 번역을 자동으로 다운로드하여 네임스페이스별 폴더에 저장
     * 각 시트 이름이 네임스페이스가 됩니다.
     */
    downloadAllSheets(localesDir: string, languages?: string[]): Promise<void>;
    /**
     * locales 폴더의 모든 네임스페이스를 자동으로 업로드
     * 각 네임스페이스 폴더가 하나의 시트가 됩니다.
     */
    uploadAllNamespaces(localesDir: string, autoTranslate?: boolean, force?: boolean): Promise<void>;
    /**
     * 스프레드시트 상태 확인
     */
    getStatus(): Promise<{
        spreadsheetId: string;
        sheetName: string;
        totalRows: number;
        lastUpdated?: string;
    }>;
    /**
     * CSV 파일에서 번역 데이터 읽기 (구글 시트 호환 형식)
     */
    readTranslationsFromCSV(csvFilePath: string): Promise<TranslationRow[]>;
    /**
     * CSV 라인 파싱 (간단한 CSV 파서)
     */
    private parseCSVLine;
    /**
     * 번역 데이터를 CSV 형식으로 저장 (구글 시트 호환)
     */
    saveTranslationsToCSV(csvFilePath: string, translations: TranslationRow[]): Promise<void>;
    /**
     * CSV 값 이스케이프
     */
    private escapeCsvValue;
    /**
     * CSV 파일을 로컬 JSON 번역 파일로 변환
     */
    convertCSVToLocalTranslations(csvFilePath: string, localesDir: string, languages?: string[]): Promise<void>;
}
export declare const defaultGoogleSheetsManager: GoogleSheetsManager;
