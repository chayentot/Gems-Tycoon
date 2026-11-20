"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

const MAP_ROWS = 24;
const FIRST_SECTION_COLUMNS = 15;
const SECOND_SECTION_COLUMNS = 15;
const THIRD_SECTION_COLUMNS = 20;
const FOURTH_SECTION_COLUMNS = 20;
const TOTAL_COLUMNS = 210;
const SECTION_DIVIDERS = new Set([15, 30, 50, 70, 90, 110, 130, 150, 170, 190]);
const EXTENDED_GEM_SECTIONS = [
  { start: 71, factoryStart: 10, factoryCount: 4, bankName: "BANK 4", gem: "METEORITE GEM", rows: [5, 10, 15, 20] },
  { start: 91, factoryStart: 14, factoryCount: 4, bankName: "BANK 5", gem: "ETERNYX", rows: [5, 10, 15, 20] },
  { start: 111, factoryStart: 18, factoryCount: 4, bankName: "BANK 6", gem: "LUNARIUM", rows: [5, 10, 15, 20] },
  { start: 131, factoryStart: 22, factoryCount: 4, bankName: "BANK 7", gem: "VOIDSTONE", rows: [5, 10, 15, 20] },
  { start: 151, factoryStart: 26, factoryCount: 4, bankName: "BANK 8", gem: "PRISMORA", rows: [5, 10, 15, 20] },
  { start: 171, factoryStart: 30, factoryCount: 4, bankName: "BANK 9", gem: "DIVINESTONE", rows: [5, 10, 15, 20] },
  { start: 191, factoryStart: 34, factoryCount: 2, bankName: "BANK 10", gem: "GENESIS CORE", rows: [8, 18] },
];

const STRUCTURES = [
  { name: "FACTORY 1", centerColumn: 19, centerRow: 12, className: "tycoon3-factory" },
  { name: "BANK", centerColumn: 27, centerRow: 13, className: "tycoon3-bank" },
  { name: "FACTORY 2", centerColumn: 38, centerRow: 5, className: "tycoon3-factory" },
  { name: "FACTORY 3", centerColumn: 38, centerRow: 10, className: "tycoon3-factory" },
  { name: "FACTORY 4", centerColumn: 38, centerRow: 15, className: "tycoon3-factory" },
  { name: "FACTORY 5", centerColumn: 38, centerRow: 20, className: "tycoon3-factory" },
  { name: "FACTORY 6", centerColumn: 58, centerRow: 5, className: "tycoon3-factory" },
  { name: "FACTORY 7", centerColumn: 58, centerRow: 10, className: "tycoon3-factory" },
  { name: "FACTORY 8", centerColumn: 58, centerRow: 15, className: "tycoon3-factory" },
  { name: "FACTORY 9", centerColumn: 58, centerRow: 20, className: "tycoon3-factory" },
  { name: "BANK 2", centerColumn: 47, centerRow: 13, className: "tycoon3-bank" },
  { name: "BANK 3", centerColumn: 67, centerRow: 13, className: "tycoon3-bank" },
  ...EXTENDED_GEM_SECTIONS.flatMap((section) => [
    ...Array.from({ length: section.factoryCount }, (_, index) => ({
      name: `FACTORY ${section.factoryStart + index}`,
      centerColumn: section.start + 7,
      centerRow: section.rows[index],
      className: "tycoon3-factory",
    })),
    { name: section.bankName, centerColumn: section.start + 16, centerRow: 13, className: "tycoon3-bank" },
  ]),
];

const STAR_CRYSTAL_PATH = [
  { column: 21, row: 12 },
  { column: 22, row: 12 },
  { column: 23, row: 12 },
  { column: 23, row: 13 },
  { column: 24, row: 13 },
  { column: 25, row: 13 },
];

const PROCESSING_FACTORIES = STRUCTURES.filter((item) => /^FACTORY ([2-9])$/.test(item.name));
const ADVANCED_FACTORIES = STRUCTURES.filter((item) => {
  const match = item.name.match(/^FACTORY (\d+)$/);
  return !!match && Number(match[1]) >= 10;
});

type BankKey = "bank1" | "bank2" | "bank3" | "bank4" | "bank5" | "bank6" | "bank7" | "bank8" | "bank9" | "bank10";
type AdvancedRecipe = {
  factoryStart: number;
  factoryEnd: number;
  interval: number;
  duration: number;
  outputBank: BankKey;
  outputKind: "meteorite" | "eternyx" | "lunarium" | "voidstone" | "prismora" | "divinestone" | "genesis";
  requirements: Partial<Record<BankKey, number>>;
  productName: string;
};
const ADVANCED_RECIPES: AdvancedRecipe[] = [
  { factoryStart: 10, factoryEnd: 13, interval: 3, duration: 60, outputBank: "bank4", outputKind: "meteorite", requirements: { bank1: 2, bank3: 2 }, productName: "Meteorite Gem" },
  { factoryStart: 14, factoryEnd: 17, interval: 4, duration: 60, outputBank: "bank5", outputKind: "eternyx", requirements: { bank2: 2, bank4: 2 }, productName: "Eternyx" },
  { factoryStart: 18, factoryEnd: 21, interval: 5, duration: 60, outputBank: "bank6", outputKind: "lunarium", requirements: { bank3: 2, bank5: 2 }, productName: "Lunarium" },
  { factoryStart: 22, factoryEnd: 25, interval: 6, duration: 60, outputBank: "bank7", outputKind: "voidstone", requirements: { bank4: 2, bank6: 2 }, productName: "Voidstone" },
  { factoryStart: 26, factoryEnd: 29, interval: 7, duration: 56, outputBank: "bank8", outputKind: "prismora", requirements: { bank5: 2, bank7: 2 }, productName: "Prismora" },
  { factoryStart: 30, factoryEnd: 33, interval: 8, duration: 64, outputBank: "bank9", outputKind: "divinestone", requirements: { bank6: 2, bank8: 2 }, productName: "Divinestone" },
  { factoryStart: 34, factoryEnd: 35, interval: 9, duration: 72, outputBank: "bank10", outputKind: "genesis", requirements: { bank9: 2, bank7: 2, bank3: 2 }, productName: "Genesis Core" },
];
const getAdvancedRecipe = (factoryName: string) => {
  const number = Number(factoryName.match(/^FACTORY (\d+)$/)?.[1]);
  return ADVANCED_RECIPES.find((recipe) => number >= recipe.factoryStart && number <= recipe.factoryEnd);
};
const BANK_DISPLAY: Record<string, { key: BankKey; label: string; symbol: string }> = {
  BANK: { key: "bank1", label: "STAR", symbol: "✦" },
  "BANK 2": { key: "bank2", label: "NEBULITE", symbol: "◆" },
  "BANK 3": { key: "bank3", label: "SOL", symbol: "✧" },
  "BANK 4": { key: "bank4", label: "METEORITE", symbol: "✹" },
  "BANK 5": { key: "bank5", label: "ETERNYX", symbol: "❖" },
  "BANK 6": { key: "bank6", label: "LUNARIUM", symbol: "☾" },
  "BANK 7": { key: "bank7", label: "VOIDSTONE", symbol: "⬟" },
  "BANK 8": { key: "bank8", label: "PRISMORA", symbol: "✺" },
  "BANK 9": { key: "bank9", label: "DIVINE", symbol: "✥" },
  "BANK 10": { key: "bank10", label: "GENESIS", symbol: "✧" },
};

const GEMSTONE_LOGOS = [
  { name: "Star Crystal", symbol: "✦", centerColumn: 3, centerRow: 7, tone: "star", amountKey: "bank1" },
  { name: "Nebulite", symbol: "◆", centerColumn: 11, centerRow: 7, tone: "nebulite", amountKey: "bank2" },
  { name: "Sol Crystal", symbol: "✧", centerColumn: 3, centerRow: 11, tone: "sol", amountKey: "bank3" },
  { name: "Meteorite Gem", symbol: "✹", centerColumn: 11, centerRow: 11, tone: "meteorite", amountKey: "bank4" },
  { name: "Eternyx", symbol: "❖", centerColumn: 3, centerRow: 15, tone: "eternyx", amountKey: "bank5" },
  { name: "Lunarium", symbol: "☾", centerColumn: 11, centerRow: 15, tone: "lunarium", amountKey: "bank6" },
  { name: "Voidstone", symbol: "⬟", centerColumn: 3, centerRow: 19, tone: "voidstone", amountKey: "bank7" },
  { name: "Prismora", symbol: "✺", centerColumn: 11, centerRow: 19, tone: "prismora", amountKey: "bank8" },
  { name: "Divinestone", symbol: "✥", centerColumn: 3, centerRow: 23, tone: "divinestone", amountKey: "bank9" },
  { name: "Genesis Core", symbol: "✧", centerColumn: 11, centerRow: 23, tone: "genesis", amountKey: "bank10" },
];

type MapPoint = { column: number; row: number };
type MovingMaterial = {
  id: number;
  kind: "star-input" | "nebulite" | "nebulite-input" | "sol" | "advanced-input" | "meteorite" | "eternyx" | "lunarium" | "voidstone" | "prismora" | "divinestone" | "genesis";
  step: number;
  path: MapPoint[];
  targetBank?: BankKey;
};
type FactoryRun = { remaining: number; active: boolean; elapsed?: number };
type TycoonGameState = {
  bank1: number;
  bank2: number;
  bank3: number;
  bank4: number;
  bank5: number;
  bank6: number;
  bank7: number;
  bank8: number;
  bank9: number;
  bank10: number;
  runs: Record<string, FactoryRun>;
  materials: MovingMaterial[];
  nextMaterialId: number;
};

function verticalPath(column: number, fromRow: number, toRow: number): MapPoint[] {
  const direction = toRow >= fromRow ? 1 : -1;
  return Array.from({ length: Math.abs(toRow - fromRow) + 1 }, (_, index) => ({
    column,
    row: fromRow + index * direction,
  }));
}

function inputPathForAdvancedFactory(factoryName: string): MapPoint[] {
  const factory = STRUCTURES.find((item) => item.name === factoryName)!;
  const number = Number(factoryName.match(/^FACTORY (\d+)$/)?.[1]);
  const section = EXTENDED_GEM_SECTIONS.find((item) => number >= item.factoryStart && number < item.factoryStart + item.factoryCount)!;
  const inputTrunk = section.start + 2;
  const path: MapPoint[] = [];
  for (let column = section.start - 4; column <= inputTrunk; column++) path.push({ column, row: 13 });
  path.push(...verticalPath(inputTrunk, 13, factory.centerRow).slice(1));
  for (let column = section.start + 3; column <= section.start + 6; column++) path.push({ column, row: factory.centerRow });
  return path;
}

function outputPathForAdvancedFactory(factoryName: string): MapPoint[] {
  const factory = STRUCTURES.find((item) => item.name === factoryName)!;
  const number = Number(factoryName.match(/^FACTORY (\d+)$/)?.[1]);
  const section = EXTENDED_GEM_SECTIONS.find((item) => number >= item.factoryStart && number < item.factoryStart + item.factoryCount)!;
  const outputTrunk = section.start + 12;
  const path: MapPoint[] = [];
  for (let column = section.start + 9; column <= outputTrunk; column++) path.push({ column, row: factory.centerRow });
  path.push(...verticalPath(outputTrunk, factory.centerRow, 13).slice(1));
  for (let column = section.start + 13; column <= section.start + 15; column++) path.push({ column, row: 13 });
  return path;
}

function inputPathForFactory(factoryName: string): MapPoint[] {
  const factory = PROCESSING_FACTORIES.find((item) => item.name === factoryName)!;
  const row = factory.centerRow;
  const isNebuliteInput = factory.centerColumn === 38;
  const trunkColumn = isNebuliteInput ? 33 : 53;
  const branchStart = isNebuliteInput ? 34 : 54;
  const path: MapPoint[] = [];
  for (let column = isNebuliteInput ? 29 : 49; column <= trunkColumn; column++) path.push({ column, row: 13 });
  path.push(...verticalPath(trunkColumn, 13, row).slice(1));
  for (let column = branchStart; column <= branchStart + 2; column++) path.push({ column, row });
  return path;
}

function outputPathForFactory(factoryName: string): MapPoint[] {
  const factory = PROCESSING_FACTORIES.find((item) => item.name === factoryName)!;
  const row = factory.centerRow;
  const isNebuliteOutput = factory.centerColumn === 38;
  const branchStart = isNebuliteOutput ? 40 : 60;
  const trunkColumn = isNebuliteOutput ? 43 : 63;
  const bankApproach = isNebuliteOutput ? 44 : 64;
  const path: MapPoint[] = [];
  for (let column = branchStart; column <= trunkColumn; column++) path.push({ column, row });
  path.push(...verticalPath(trunkColumn, row, 13).slice(1));
  path.push({ column: bankApproach, row: 13 }, { column: bankApproach + 1, row: 13 });
  return path;
}

const CONVEYOR_CELLS = new Set([
  // Factory 1 route toward Bank 1
  "29,13", "30,13",
  "23,13", "24,13", "25,13",
  "21,12", "22,12", "23,12",

  // Bank 1 input route to F2-F5: right-side trunk, vertical riser, and factory branches
  "29,13", "30,13", "31,13", "32,13", "33,13",
  "33,5", "33,6", "33,7", "33,8", "33,9",
  "33,10", "33,11", "33,12", "33,14", "33,15",
  "33,16", "33,17", "33,18", "33,19", "33,20",
  "34,5", "35,5", "36,5",
  "33,10", "34,10", "35,10", "36,10",
  "33,15", "34,15", "35,15", "36,15",
  "33,20", "34,20", "35,20", "36,20",
  "40,5", "41,5", "42,5",
  "40,10", "41,10", "42,10",
  "40,15", "41,15", "42,15",
  "40,20", "41,20", "42,20",
  "43,5", "43,6", "43,7", "43,8", "43,9",
  "43,10", "43,11", "43,12", "43,13", "43,14",
  "43,15", "43,16", "43,17", "43,18", "43,19", "43,20",
  "40,13", "41,13", "42,13", "44,13", "45,13",

  // Bank 2 input route to F6-F9: right-side trunk, vertical riser, and factory branches
  "49,13", "50,13", "51,13", "52,13", "53,13",
  "53,5", "53,6", "53,7", "53,8", "53,9",
  "53,10", "53,11", "53,12", "53,14", "53,15",
  "53,16", "53,17", "53,18", "53,19", "53,20",
  "54,5", "55,5", "56,5",
  "54,10", "55,10", "56,10",
  "54,15", "55,15", "56,15",
  "54,20", "55,20", "56,20",

  // F6-F9 output branches and connected trunk into Bank 3
  "60,5", "61,5", "62,5",
  "60,10", "61,10", "62,10",
  "60,15", "61,15", "62,15",
  "60,20", "61,20", "62,20",
  "63,5", "63,6", "63,7", "63,8", "63,9",
  "63,10", "63,11", "63,12", "63,13", "63,14",
  "63,15", "63,16", "63,17", "63,18", "63,19", "63,20",
  "49,13", "50,13", "51,13", "52,13", "53,13", "54,13",
  "55,13", "56,13", "57,13", "58,13", "59,13", "60,13",
  "61,13", "62,13", "64,13", "65,13",
]);

// Repeated 20-column production sections: shared input trunk, four factory branches,
// output trunk, and one bank. Genesis Core uses two vertically separated factories.
for (const section of EXTENDED_GEM_SECTIONS) {
  const inputTrunk = section.start + 2;
  const outputTrunk = section.start + 12;
  const factoryRows = section.rows;
  for (let column = section.start - 4; column <= inputTrunk; column++) {
    CONVEYOR_CELLS.add(`${column},13`);
  }
  for (let row = 5; row <= 20; row++) {
    CONVEYOR_CELLS.add(`${inputTrunk},${row}`);
    CONVEYOR_CELLS.add(`${outputTrunk},${row}`);
  }
  for (const row of factoryRows) {
    for (let column = inputTrunk; column <= section.start + 6; column++) {
      CONVEYOR_CELLS.add(`${column},${row}`);
    }
    for (let column = section.start + 9; column <= outputTrunk; column++) {
      CONVEYOR_CELLS.add(`${column},${row}`);
    }
  }
  for (let column = section.start + 9; column <= section.start + 15; column++) {
    CONVEYOR_CELLS.add(`${column},13`);
  }
}


function getStructureAt(column: number, row: number) {
  return STRUCTURES.find((structure) =>
    Math.abs(column - structure.centerColumn) <= 1 &&
    Math.abs(row - structure.centerRow) <= 1
  );
}

export default function GemsTycoon3Page() {
  const mapDragRef = useRef<{ startX: number; scrollLeft: number; moved: boolean } | null>(null);
  const [isFactoryRunning, setIsFactoryRunning] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [transferDirection, setTransferDirection] = useState<"deposit" | "withdraw">("deposit");
  const [transferAmount, setTransferAmount] = useState("1");
  const [mainGold, setMainGold] = useState(0);
  const [map3Gold, setMap3Gold] = useState(0);
  const [walletStatus, setWalletStatus] = useState("Loading Gold wallets…");
  const [walletBusy, setWalletBusy] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [starCrystals, setStarCrystals] = useState<{ id: number; step: number }[]>([]);
  const nextCrystalId = useRef(0);
  const [game, setGame] = useState<TycoonGameState>({
    bank1: 0,
    bank2: 0,
    bank3: 0,
    bank4: 0,
    bank5: 0,
    bank6: 0,
    bank7: 0,
    bank8: 0,
    bank9: 0,
    bank10: 0,
    runs: {},
    materials: [],
    nextMaterialId: 0,
  });

  const loadGoldWallets = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setWalletStatus("Please sign in to use Map 3 Gold."); return; }
      const [main, map] = await Promise.all([
        supabase.from("wallets").select("gold_balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("tycoon3_wallets").select("gold_balance").eq("user_id", user.id).maybeSingle(),
      ]);
      if (main.error || map.error) throw main.error || map.error;
      setMainGold(Number(main.data?.gold_balance ?? 0));
      setMap3Gold(Number(map.data?.gold_balance ?? 0));
      setWalletStatus("");
    } catch (error) { setWalletStatus(error instanceof Error ? error.message : "Unable to load Gold wallets."); }
  };
  useEffect(() => { void loadGoldWallets(); }, []);

  const transferGold = async () => {
    setWalletBusy(true); setWalletStatus("");
    try {
      const amount = Number(transferAmount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid Gold amount.");
      const { data, error } = await createClient().rpc("tycoon3_gold_transfer", {
        p_direction: transferDirection, p_gold_amount: amount,
      });
      if (error) throw error;
      const result = data as { fee: number; received: number };
      setWalletStatus(`Transfer successful. Fee: ${Number(result.fee).toLocaleString()} Gold. Received: ${Number(result.received).toLocaleString()} Gold.`);
      await loadGoldWallets();
    } catch (error) { setWalletStatus(error instanceof Error ? error.message : "Gold transfer failed."); }
    finally { setWalletBusy(false); }
  };

  useEffect(() => {
    if (!isFactoryRunning) return;
    const timer = window.setInterval(() => {
      setStarCrystals((current) => [
        ...current,
        { id: ++nextCrystalId.current, step: 0 },
      ]);
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isFactoryRunning]);

  useEffect(() => {
    if (remainingSeconds === 0) setIsFactoryRunning(false);
  }, [remainingSeconds]);

  const hasCrystalsOnConveyor = starCrystals.length > 0;

  useEffect(() => {
    if (!hasCrystalsOnConveyor) return;
    const conveyor = window.setInterval(() => {
      setStarCrystals((current) =>
        current.map((crystal) => ({ ...crystal, step: crystal.step + 1 }))
      );
    }, 300);
    return () => window.clearInterval(conveyor);
  }, [hasCrystalsOnConveyor]);

  useEffect(() => {
    const delivered = starCrystals.filter((crystal) => crystal.step >= STAR_CRYSTAL_PATH.length);
    if (delivered.length === 0) return;
    setGame((current) => ({ ...current, bank1: current.bank1 + delivered.length }));
    setStarCrystals((current) =>
      current.filter((crystal) => crystal.step < STAR_CRYSTAL_PATH.length)
    );
  }, [starCrystals]);

  const startFactory = () => {
    if (remainingSeconds === 0) setRemainingSeconds(60);
    setIsFactoryRunning(true);
  };

  const canStartAdvancedFactory = (factoryName: string, state: TycoonGameState = game) => {
    const recipe = getAdvancedRecipe(factoryName);
    if (!recipe || state.runs[factoryName]?.active) return false;
    const outputsPerRun = recipe.duration / recipe.interval;
    return Object.entries(recipe.requirements).every(([bank, perOutput]) =>
      state[bank as BankKey] >= (perOutput ?? 0) * outputsPerRun
    );
  };

  const startAdvancedFactory = (factoryName: string) => {
    setGame((current) => {
      const recipe = getAdvancedRecipe(factoryName);
      if (!recipe || !canStartAdvancedFactory(factoryName, current)) return current;
      const outputsPerRun = recipe.duration / recipe.interval;
      const updatedBanks = { ...current };
      for (const [bank, perOutput] of Object.entries(recipe.requirements)) {
        const key = bank as BankKey;
        updatedBanks[key] = current[key] - (perOutput ?? 0) * outputsPerRun;
      }
      return {
        ...updatedBanks,
        runs: { ...current.runs, [factoryName]: { remaining: recipe.duration, elapsed: 0, active: true } },
      };
    });
  };

  const canStartProcessingFactory = (factoryName: string, state: TycoonGameState = game) => {
    const factory = PROCESSING_FACTORIES.find((item) => item.name === factoryName);
    if (!factory || state.runs[factoryName]?.active) return false;
    const availableResources = factory.centerColumn === 38 ? state.bank1 : state.bank2;
    return availableResources >= 120;
  };

  const startProcessingFactory = (factoryName: string) => {
    // Reserve all 120 required materials at start so concurrent factories
    // cannot spend the same bank balance.
    setGame((current) => {
      if (!canStartProcessingFactory(factoryName, current)) return current;
      const factory = PROCESSING_FACTORIES.find((item) => item.name === factoryName);
      if (!factory) return current;
      const bankKey = factory.centerColumn === 38 ? "bank1" : "bank2";
      return {
        ...current,
        [bankKey]: current[bankKey] - 120,
        runs: { ...current.runs, [factoryName]: { remaining: 60, active: true } },
      };
    });
  };

  const anyProcessingFactoryRunning = PROCESSING_FACTORIES.some((factory) => game.runs[factory.name]?.active);
  const anyAdvancedFactoryRunning = ADVANCED_FACTORIES.some((factory) => game.runs[factory.name]?.active);

  useEffect(() => {
    if (!anyProcessingFactoryRunning) return;
    const timer = window.setInterval(() => {
      setGame((current) => {
        const next = { ...current, runs: { ...current.runs }, materials: [...current.materials] };
        for (const factory of PROCESSING_FACTORIES) {
          const run = next.runs[factory.name];
          if (!run?.active) continue;
          const isNebuliteFactory = factory.centerColumn === 38;
          const inputPath = inputPathForFactory(factory.name);
          const outputPath = outputPathForFactory(factory.name);
          const inputKind = isNebuliteFactory ? "star-input" : "nebulite-input";
          const outputKind = isNebuliteFactory ? "nebulite" : "sol";
          for (let index = 0; index < 2; index++) {
            next.materials.push({
              id: ++next.nextMaterialId,
              kind: inputKind,
              step: 0,
              path: inputPath,
            });
          }
          next.materials.push({
            id: ++next.nextMaterialId,
            kind: outputKind,
            step: -inputPath.length,
            path: outputPath,
          });
          const remaining = Math.max(0, run.remaining - 1);
          next.runs[factory.name] = { remaining, active: remaining > 0 };
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [anyProcessingFactoryRunning]);

  useEffect(() => {
    if (!anyAdvancedFactoryRunning) return;
    const timer = window.setInterval(() => {
      setGame((current) => {
        const next = { ...current, runs: { ...current.runs }, materials: [...current.materials] };
        for (const factory of ADVANCED_FACTORIES) {
          const run = next.runs[factory.name];
          const recipe = getAdvancedRecipe(factory.name);
          if (!run?.active || !recipe) continue;
          const elapsed = (run.elapsed ?? 0) + 1;
          const remaining = Math.max(0, recipe.duration - elapsed);
          if (elapsed % recipe.interval === 0) {
            const inputPath = inputPathForAdvancedFactory(factory.name);
            const outputPath = outputPathForAdvancedFactory(factory.name);
            const inputCount = Object.values(recipe.requirements).reduce((sum, amount) => sum + (amount ?? 0), 0);
            for (let index = 0; index < inputCount; index++) {
              next.materials.push({
                id: ++next.nextMaterialId,
                kind: "advanced-input",
                step: 0,
                path: inputPath,
              });
            }
            next.materials.push({
              id: ++next.nextMaterialId,
              kind: recipe.outputKind,
              step: -inputPath.length,
              path: outputPath,
              targetBank: recipe.outputBank,
            });
          }
          next.runs[factory.name] = { remaining, elapsed, active: remaining > 0 };
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [anyAdvancedFactoryRunning]);

  const hasMovingMaterials = game.materials.length > 0;
  useEffect(() => {
    if (!hasMovingMaterials) return;
    const conveyor = window.setInterval(() => {
      setGame((current) => {
        let bank2Delivered = 0;
        let bank3Delivered = 0;
        const advancedDelivered: Partial<Record<BankKey, number>> = {};
        const moving = current.materials
          .map((material) => ({ ...material, step: material.step + 1 }))
          .filter((material) => {
            if (material.step < material.path.length) return true;
            if (material.kind === "nebulite") bank2Delivered++;
            if (material.kind === "sol") bank3Delivered++;
            if (material.targetBank) advancedDelivered[material.targetBank] = (advancedDelivered[material.targetBank] ?? 0) + 1;
            return false;
          });
        if (moving.length === current.materials.length && bank2Delivered === 0 && bank3Delivered === 0 && Object.keys(advancedDelivered).length === 0) {
          return { ...current, materials: moving };
        }
        const bankUpdates: Partial<Record<BankKey, number>> = {};
        for (const [bank, count] of Object.entries(advancedDelivered)) {
          const key = bank as BankKey;
          bankUpdates[key] = current[key] + (count ?? 0);
        }
        return {
          ...current,
          ...bankUpdates,
          materials: moving,
          bank2: current.bank2 + bank2Delivered,
          bank3: current.bank3 + bank3Delivered,
        };
      });
    }, 300);
    return () => window.clearInterval(conveyor);
  }, [hasMovingMaterials]);

  const formattedTime = `00:${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <main className="shell tycoon3-shell">
      <section className="tycoon3-header-section" aria-label="Game header">
        <header className="topbar tycoon3-topbar">
          <div className="brand">💎 GEMS TYCOON</div>
          <nav className="row" aria-label="Main navigation"><span aria-current="page">MAP 3</span></nav>
        </header>
      </section>

      <div className="tycoon3-map-space">
        <section
          className="tycoon3-map-section"
          aria-label="3rd Map grid"
          onMouseDown={(event) => {
            if (event.button !== 0 || (event.target as HTMLElement).closest("button, a, input, select, textarea")) return;
            mapDragRef.current = {
              startX: event.clientX,
              scrollLeft: event.currentTarget.scrollLeft,
              moved: false,
            };
            event.currentTarget.classList.add("tycoon3-map-dragging");
          }}
          onMouseMove={(event) => {
            const drag = mapDragRef.current;
            if (!drag) return;
            const distance = event.clientX - drag.startX;
            if (Math.abs(distance) > 3) drag.moved = true;
            event.currentTarget.scrollLeft = drag.scrollLeft - distance;
          }}
          onMouseUp={(event) => {
            if (mapDragRef.current?.moved) {
              event.preventDefault();
              window.setTimeout(() => { mapDragRef.current = null; }, 0);
            } else {
              mapDragRef.current = null;
            }
            event.currentTarget.classList.remove("tycoon3-map-dragging");
          }}
          onMouseLeave={(event) => {
            mapDragRef.current = null;
            event.currentTarget.classList.remove("tycoon3-map-dragging");
          }}
          onDragStart={(event) => event.preventDefault()}
        >
          <div className="tycoon3-grid">
            {Array.from({ length: TOTAL_COLUMNS * MAP_ROWS }, (_, index) => {
              const column = Math.floor(index / MAP_ROWS) + 1;
              const row = (index % MAP_ROWS) + 1;
              const isYellowDivider = column === 15;
              const isRedDivider = column === 30;
              const isGreenDivider = SECTION_DIVIDERS.has(column) && !isYellowDivider && !isRedDivider;
              const structure = getStructureAt(column, row);
              const isStructureCenter = structure?.centerColumn === column && structure?.centerRow === row;
              const isConveyor = CONVEYOR_CELLS.has(`${column},${row}`);

              const cellClassName = [
                "tycoon3-cell",
                isYellowDivider && "tycoon3-divider-yellow",
                isRedDivider && "tycoon3-divider-red",
                isGreenDivider && "tycoon3-divider-green",
                structure?.className,
                isConveyor && "tycoon3-conveyor",
              ].filter(Boolean).join(" ");

              return (
                <div
                  className={cellClassName}
                  key={index}
                  style={{ gridColumn: column, gridRow: row }}
                  aria-label={`Column ${column}, Row ${row}${structure ? `, ${structure.name}` : isConveyor ? ", conveyor moving right" : ""}`}
                >
                  {isStructureCenter && (
                    <span className="tycoon3-structure-label">
                      {structure.name}
                      {BANK_DISPLAY[structure.name] && (
                        <small className="tycoon3-bank-count">
                          {BANK_DISPLAY[structure.name].symbol} {game[BANK_DISPLAY[structure.name].key]} {BANK_DISPLAY[structure.name].label}
                        </small>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
            <div
              className="tycoon3-profile-logo"
              style={{ gridColumn: "2 / span 3", gridRow: "2 / span 3" }}
              aria-label="Profile logo"
              title="Profile"
            >
              <span className="tycoon3-profile-avatar">👤</span>
              <small>PROFILE</small>
            </div>
            {GEMSTONE_LOGOS.map((gem) => {
              const amount = game[gem.amountKey as BankKey];
              const quantityColumn = gem.centerColumn + 2;
              return (
                <>
                  <div key={gem.name + "-logo"} className={`tycoon3-gem-logo tycoon3-gem-${gem.tone}`} style={{ gridColumn: `${gem.centerColumn - 1} / span 3`, gridRow: `${gem.centerRow - 1} / span 3` }} aria-label={gem.name + " logo"}>
                    <span className="tycoon3-gem-symbol">{gem.symbol}</span>
                    <small>{gem.name}</small>
                  </div>
                  <div key={gem.name + "-quantity"} className="tycoon3-gem-quantity" style={{ gridColumn: `${quantityColumn} / span 3`, gridRow: `${gem.centerRow - 1} / span 3` }} aria-label={amount + " " + gem.name + " available in bank"}>
                    <small>IN BANK</small>
                    <strong>{amount.toLocaleString()}</strong>
                  </div>
                </>
              );
            })}
            <button
              type="button"
              className="tycoon3-play-button"
              style={{ gridColumn: 19, gridRow: 10 }}
              onClick={startFactory}
              disabled={isFactoryRunning}
              aria-label="Start Factory 1 for 60 seconds"
              hidden={isFactoryRunning}
            >
              PLAY
            </button>
            {PROCESSING_FACTORIES.map((factory) => {
              const run = game.runs[factory.name];
              const canStart = canStartProcessingFactory(factory.name);
              const buttonRow = factory.name === "FACTORY 8" ? 12 : factory.centerRow - 2;
              const buttonColumn = factory.centerColumn;
              return (
                <button
                  key={factory.name}
                  type="button"
                  className={`tycoon3-play-button tycoon3-processing-button ${!canStart && !run?.active ? "tycoon3-play-locked" : ""}`}
                  style={{ gridColumn: buttonColumn, gridRow: buttonRow }}
                  onClick={() => startProcessingFactory(factory.name)}
                  disabled={!canStart}
                  aria-disabled={!canStart}
                  aria-label={run?.active ? `${factory.name}, ${run.remaining} seconds remaining` : canStart ? `Start ${factory.name} for 60 seconds` : `${factory.name} locked: requires 120 resources in its input bank`}
                  title={run?.active ? `${run.remaining}s remaining` : canStart ? `Start ${factory.name}` : `Requires 120 ${factory.centerColumn === 38 ? "Star Crystals in Bank 1" : "Nebulite Stones in Bank 2"}`}
                >
                  {run?.active ? `${run.remaining}s` : canStart ? "PLAY" : "NEED 120"}
                </button>
              );
            })}
            {ADVANCED_FACTORIES.map((factory) => {
              const run = game.runs[factory.name];
              const recipe = getAdvancedRecipe(factory.name);
              const canStart = canStartAdvancedFactory(factory.name);
              const required = recipe
                ? Object.entries(recipe.requirements).map(([bank, amount]) => `${(amount ?? 0) * (recipe.duration / recipe.interval)} ${BANK_DISPLAY[Object.keys(BANK_DISPLAY).find((name) => BANK_DISPLAY[name].key === bank) ?? "BANK"].label}`).join(" + ")
                : "required resources";
              return (
                <button
                  key={factory.name}
                  type="button"
                  className={`tycoon3-play-button tycoon3-processing-button ${!canStart && !run?.active ? "tycoon3-play-locked" : ""}`}
                  style={{ gridColumn: factory.centerColumn, gridRow: factory.centerRow - 2 }}
                  onClick={() => startAdvancedFactory(factory.name)}
                  disabled={!canStart}
                  aria-disabled={!canStart}
                  aria-label={run?.active ? `${factory.name}, ${run.remaining} seconds remaining` : canStart ? `Start ${factory.name} for ${recipe?.duration} seconds` : `${factory.name} locked: insufficient resources`}
                  title={run?.active ? `${run.remaining}s remaining` : canStart ? `Start ${factory.name}` : `Requires ${required} in the input banks`}
                >
                  {run?.active ? `${run.remaining}s` : canStart ? "PLAY" : "NEED"}
                </button>
              );
            })}
            <div className="tycoon3-level-label" style={{ gridColumn: "16 / span 2", gridRow: 12 }}>
              LVL 1
            </div>
            <div className="tycoon3-time-display" style={{ gridColumn: "18 / span 3", gridRow: 14 }}>
              {formattedTime}
            </div>
            {game.materials.filter((material) => material.step >= 0).map((material) => {
              const position = material.path[Math.min(material.step, material.path.length - 1)];
              const symbolByKind: Record<MovingMaterial["kind"], string> = {
                "star-input": "✦",
                "nebulite-input": "◆",
                "nebulite": "◆",
                "sol": "✧",
                "advanced-input": "✦",
                "meteorite": "✹",
                "eternyx": "❖",
                "lunarium": "☾",
                "voidstone": "⬟",
                "prismora": "✺",
                "divinestone": "✥",
                "genesis": "✧",
              };
              const symbol = symbolByKind[material.kind];
              return (
                <div
                  key={material.id}
                  className={`tycoon3-moving-material tycoon3-material-${material.kind}`}
                  style={{ gridColumn: position.column, gridRow: position.row }}
                  aria-label={`${material.kind} moving on conveyor`}
                >
                  {symbol}
                </div>
              );
            })}
            {starCrystals.map((crystal) => {
              const position = STAR_CRYSTAL_PATH[Math.min(crystal.step, STAR_CRYSTAL_PATH.length - 1)];
              return (
                <div
                  key={crystal.id}
                  className="tycoon3-star-crystal"
                  style={{ gridColumn: position.column, gridRow: position.row }}
                  aria-label="Star Crystal moving to Bank"
                >
                  ✦
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {tradeOpen && (
        <div className="tycoon3-trade-backdrop" role="presentation" onClick={() => setTradeOpen(false)}>
          <section className="tycoon3-trade-panel" role="dialog" aria-modal="true" aria-labelledby="tycoon3-trade-title" onClick={(event) => event.stopPropagation()}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 id="tycoon3-trade-title">Map 3 Trade & Gold Wallet</h2>
              <button type="button" className="secondary" onClick={() => setTradeOpen(false)}>Close</button>
            </div>
            <div className="tycoon3-wallet-cards">
              <div><small>Main Wallet Gold</small><strong>{mainGold.toLocaleString(undefined,{maximumFractionDigits:4})}</strong></div>
              <div><small>Map 3 Gold</small><strong>{map3Gold.toLocaleString(undefined,{maximumFractionDigits:4})}</strong></div>
            </div>
            <p className="small">Gold is separate between wallets. Transfers have a 3% fee; the amount entered is deducted from the sending wallet and 97% is credited to the receiving wallet.</p>
            <div className="row">
              <button type="button" className={transferDirection==="deposit"?"":"secondary"} onClick={() => setTransferDirection("deposit")}>Deposit</button>
              <button type="button" className={transferDirection==="withdraw"?"":"secondary"} onClick={() => setTransferDirection("withdraw")}>Withdraw</button>
            </div>
            <label>{transferDirection==="deposit"?"Main Wallet → Map 3":"Map 3 → Main Wallet"} Gold amount</label>
            <input type="number" min="0.00000001" step="0.00000001" value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} />
            <div className="small">Fee: {(Math.max(0,Number(transferAmount)||0)*0.03).toLocaleString(undefined,{maximumFractionDigits:8})} Gold · You receive: {(Math.max(0,Number(transferAmount)||0)*0.97).toLocaleString(undefined,{maximumFractionDigits:8})} Gold</div>
            <button type="button" disabled={walletBusy || Number(transferAmount)<=0 || Number(transferAmount)>(transferDirection==="deposit"?mainGold:map3Gold)} onClick={transferGold}>{walletBusy?"Processing…":transferDirection==="deposit"?"Deposit Gold to Map 3":"Withdraw Gold to Main Wallet"}</button>
            {walletStatus && <p className="small">{walletStatus}</p>}
            <h3>Gemstone Trade Rates</h3>
            <p className="small">Suggested base rates per gemstone. Trade inventory conversion is not yet connected to the Map 3 production banks.</p>
            <div className="tycoon3-rate-grid">
              {GEMSTONE_LOGOS.map((gem,index)=><div key={gem.name}><span>{gem.name}</span><strong>{[1,2,3,5,10,20,40,80,160,320][index]} Gold</strong></div>)}
            </div>
          </section>
        </div>
      )}

      <footer className="tycoon-map-footer" aria-label="Tycoon map navigation">
        <button type="button" className="tycoon-map-tab" onClick={() => { void loadGoldWallets(); setTradeOpen(true); }}>Trade</button>
        <span className="tycoon-map-tab active" aria-current="page">Map 3</span>
      </footer>

      <style jsx>{`
        .tycoon3-trade-backdrop { position: fixed; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center; padding: 16px; background: #020617cc; }\n        .tycoon3-trade-panel { width: min(760px,100%); max-height: min(88dvh,820px); overflow-y: auto; padding: clamp(12px,2.5vw,24px); border: 1px solid #64748b; border-radius: 16px; background: #111c2e; color: #f8fafc; box-shadow: 0 20px 60px #000a; }
        .tycoon3-trade-panel h2 { font-size: clamp(18px,3vw,24px); }
        .tycoon3-trade-panel h3 { margin: 18px 0 6px; }
        .tycoon3-trade-panel .row { flex-wrap: wrap; }
        .tycoon3-wallet-cards { grid-template-columns: repeat(2,minmax(0,1fr)); }
        .tycoon3-rate-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
        .tycoon3-rate-grid div { align-items: center; min-width: 0; }
        .tycoon3-rate-grid span { overflow-wrap: anywhere; }
        .tycoon3-trade-panel button { min-height: 40px; }
        .tycoon-map-tab { border: 0; cursor: pointer; font: inherit; }\n        .tycoon3-wallet-cards,.tycoon3-rate-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; margin: 12px 0; }\n        .tycoon3-wallet-cards div,.tycoon3-rate-grid div { display:flex; justify-content:space-between; gap:8px; padding:10px; border:1px solid #475569; border-radius:8px; background:#1e293b; }\n        .tycoon3-wallet-cards div { flex-direction:column; }\n        .tycoon3-wallet-cards strong { color:#fde68a; font-size:20px; }\n        .tycoon3-rate-grid { grid-template-columns:1fr; }\n        .tycoon3-rate-grid strong { color:#fde68a; white-space:nowrap; }\n        .tycoon3-trade-panel label { display:block; margin:12px 0 6px; }\n        .tycoon3-trade-panel input { width:100%; padding:10px; border-radius:8px; border:1px solid #64748b; background:#0f172a; color:#fff; }\n        .tycoon3-trade-panel button { padding:9px 12px; border-radius:8px; border:0; background:#facc15; color:#172554; font-weight:800; cursor:pointer; }\n        .tycoon3-trade-panel button.secondary { background:#334155; color:#fff; }\n        .tycoon3-trade-panel button:disabled { opacity:.5; cursor:not-allowed; }\n        .tycoon3-shell {
          width: min(1180px, calc(100% - 40px));
          height: 100vh;
          height: 100dvh;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 12px 0 100px;
          overflow: hidden;
        }
        .tycoon3-header-section {
          flex: 0 0 auto;
          width: 100%;
          margin-bottom: 14px;
          padding: 8px;
          border: 1px solid #334155;
          border-radius: 18px;
          background: linear-gradient(145deg, #142238, #0d1524);
          box-shadow: 0 10px 28px #0005;
        }
        .tycoon3-topbar {
          position: relative;
          inset: auto;
          transform: none;
          z-index: 2;
          box-sizing: border-box;
          width: 100%;
          margin: 0;
          padding: 13px 16px 13px 20px;
          border: 1px solid #ffffff12;
          background: #0d1524c9;
        }
        .tycoon3-topbar nav.row { gap: 5px; }
        .tycoon3-topbar nav.row a { padding: 10px 13px; }
        .tycoon3-map-space {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          align-items: stretch;
        }
        .tycoon3-map-section {
          width: 100%;
          min-width: 0;
          min-height: 0;
          flex: 1 1 auto;
          overflow-x: auto;
          overflow-y: hidden;
          cursor: grab;
          user-select: none;
          border: 1px solid #334155;
          border-radius: 14px;
          background: rgba(17, 28, 46, 0.45);
          scrollbar-color: #64748b #111c2e;
          scrollbar-width: thin;
        }
        .tycoon3-map-section.tycoon3-map-dragging { cursor: grabbing; }
        .tycoon3-map-section.tycoon3-map-dragging * { cursor: grabbing !important; }
        .tycoon3-grid {
          --tycoon3-cell-size: calc((100dvh - 226px) / 24);
          display: grid;
          width: max-content;
          height: calc(var(--tycoon3-cell-size) * 24);
          grid-auto-flow: column;
          grid-template-rows: repeat(24, var(--tycoon3-cell-size));
          grid-auto-columns: var(--tycoon3-cell-size);
        }
        .tycoon3-cell {
          min-width: 0;
          min-height: 0;
          border-right: 1px solid #64748b88;
          border-bottom: 1px solid #64748b88;
          background: #15223855;
          user-select: none;
        }
        .tycoon3-cell:nth-child(24n + 1) {
          border-top: 1px solid #64748b88;
        }
        .tycoon3-divider-yellow {
          border-right: 4px solid #facc15;
        }
        .tycoon3-divider-red {
          border-right: 4px solid #ef4444;
        }
        .tycoon3-divider-green {
          border-right: 4px solid #22c55e;
        }
        .tycoon3-factory {
          background: linear-gradient(145deg, #92400e, #f59e0b 52%, #78350f);
          border: 1px solid #fbbf24;
          box-shadow: inset 0 0 0 1px #fff3, inset 0 0 10px #0008;
          position: relative;
          z-index: 1;
        }
        .tycoon3-bank {
          background: linear-gradient(145deg, #334155, #94a3b8 52%, #1e293b);
          border: 1px solid #cbd5e1;
          box-shadow: inset 0 0 0 1px #fff5, inset 0 0 10px #0008;
          position: relative;
          z-index: 1;
        }
        .tycoon3-bank-count {
          display: block;
          margin-top: 3px;
          color: #bae6fd;
          font-size: clamp(7px, 0.68vw, 10px);
          line-height: 1.1;
          font-weight: 900;
          white-space: nowrap;
          text-shadow: 0 0 4px #0284c7, 0 1px 2px #000;
        }
        .tycoon3-profile-logo,
        .tycoon3-gem-logo {
          z-index: 3;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          margin: 3px;
          border: 2px solid #94a3b8;
          border-radius: 8px;
          background: linear-gradient(145deg, #1e293b, #0f172a);
          box-shadow: inset 0 0 10px #ffffff18, 0 2px 7px #0008;
          color: #f8fafc;
          text-align: center;
          overflow: hidden;
          pointer-events: none;
        }
        .tycoon3-profile-logo {
          border-color: #60a5fa;
          background: radial-gradient(circle at 50% 30%, #334155, #0f172a 75%);
        }
        .tycoon3-profile-avatar { font-size: clamp(18px, 2vw, 30px); line-height: 1; }
        .tycoon3-profile-logo small,
        .tycoon3-gem-logo small { font-size: clamp(6px, .62vw, 9px); font-weight: 900; line-height: 1; }
        .tycoon3-gem-symbol { font-size: clamp(18px, 2vw, 30px); line-height: 1; text-shadow: 0 0 9px currentColor; }
        .tycoon3-gem-star { color: #bae6fd; border-color: #38bdf8; background: linear-gradient(145deg, #164e63, #0c1d35); }
        .tycoon3-gem-nebulite { color: #c4b5fd; border-color: #8b5cf6; background: linear-gradient(145deg, #4c1d95, #17112f); }
        .tycoon3-gem-sol { color: #fde68a; border-color: #f59e0b; background: linear-gradient(145deg, #92400e, #422006); }
        .tycoon3-gem-meteorite { color: #fb923c; border-color: #c2410c; background: linear-gradient(145deg, #431407, #1c1917); }
        .tycoon3-gem-eternyx { color: #f0abfc; border-color: #c026d3; background: linear-gradient(145deg, #701a75, #2e1065); }
        .tycoon3-gem-lunarium { color: #e0e7ff; border-color: #818cf8; background: linear-gradient(145deg, #312e81, #111827); }
        .tycoon3-gem-voidstone { color: #a78bfa; border-color: #7c3aed; background: linear-gradient(145deg, #272044, #09090b); }
        .tycoon3-gem-prismora { color: #67e8f9; border-color: #06b6d4; background: linear-gradient(145deg, #164e63, #172554); }
        .tycoon3-gem-divinestone { color: #fef3c7; border-color: #facc15; background: linear-gradient(145deg, #713f12, #292015); }
        .tycoon3-gem-genesis { color: #86efac; border-color: #22c55e; background: linear-gradient(145deg, #14532d, #052e16); }
        .tycoon3-gem-quantity {
          z-index: 4;
          align-self: stretch;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          margin: 5px 2px;
          border: 1px solid #64748b;
          border-radius: 6px;
          background: #0f172ae8;
          color: #e2e8f0;
          pointer-events: none;
        }
        .tycoon3-gem-quantity small { font-size: clamp(6px, .55vw, 8px); color: #94a3b8; }
        .tycoon3-gem-quantity strong { font-size: clamp(9px, 1vw, 15px); font-variant-numeric: tabular-nums; }
        .tycoon3-play-button {
          box-sizing: border-box;
          width: calc(100% - 6px);
          height: calc(100% - 6px);
          min-width: 0;
          min-height: 0;
          max-width: 100%;
          max-height: 100%;
          align-self: stretch;
          justify-self: stretch;
          padding: 0;
          margin: 3px;
          border: 2px solid #86efac;
          border-radius: 6px;
          color: #052e16;
          background: linear-gradient(145deg, #bbf7d0, #22c55e);
          box-shadow: 0 2px 6px #0008, inset 0 1px 2px #fff9;
          font-size: clamp(7px, 0.75vw, 11px);
          font-weight: 900;
          cursor: pointer;
        }
        .tycoon3-play-button:hover { filter: brightness(1.12); }
        .tycoon3-play-button:disabled { opacity: .55; cursor: not-allowed; }
        .tycoon3-processing-button { z-index: 8; }
        .tycoon3-processing-button.tycoon3-play-locked {
          color: #cbd5e1;
          border-color: #64748b;
          background: linear-gradient(145deg, #475569, #1e293b);
          box-shadow: inset 0 1px 2px #fff2;
        }
        .tycoon3-level-label,
        .tycoon3-time-display {
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #facc15;
          border-radius: 5px;
          color: #fff;
          background: #172554;
          box-shadow: 0 2px 6px #0008, inset 0 0 8px #facc1544;
          font-weight: 900;
          text-shadow: 0 1px 3px #000;
          white-space: nowrap;
        }
        .tycoon3-level-label {
          margin: 3px;
          font-size: clamp(7px, 0.75vw, 11px);
        }
        .tycoon3-time-display {
          margin: 2px;
          font-size: clamp(9px, 0.95vw, 14px);
          font-variant-numeric: tabular-nums;
          letter-spacing: .04em;
        }
        .tycoon3-moving-material {
          z-index: 6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(12px, 1.2vw, 19px);
          font-weight: 900;
          pointer-events: none;
          text-shadow: 0 0 5px #fff, 0 0 9px currentColor;
          animation: tycoon3-crystal-pulse .6s ease-in-out infinite alternate;
        }
        .tycoon3-material-star-input { color: #bae6fd; }
        .tycoon3-material-nebulite-input,
        .tycoon3-material-nebulite { color: #c4b5fd; }
        .tycoon3-material-sol { color: #fde68a; }
        .tycoon3-material-advanced-input { color: #e2e8f0; }
        .tycoon3-material-meteorite { color: #fb923c; }
        .tycoon3-material-eternyx { color: #f0abfc; }
        .tycoon3-material-lunarium { color: #e0e7ff; }
        .tycoon3-material-voidstone { color: #a78bfa; }
        .tycoon3-material-prismora { color: #67e8f9; }
        .tycoon3-material-divinestone { color: #fef3c7; }
        .tycoon3-material-genesis { color: #86efac; }
        .tycoon3-star-crystal {
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #bae6fd;
          font-size: clamp(13px, 1.3vw, 20px);
          font-weight: 900;
          text-shadow: 0 0 5px #38bdf8, 0 0 10px #e0f2fe;
          pointer-events: none;
          animation: tycoon3-crystal-pulse .6s ease-in-out infinite alternate;
        }
        @keyframes tycoon3-crystal-pulse {
          from { transform: scale(.8) rotate(0deg); }
          to { transform: scale(1.15) rotate(45deg); }
        }
        .tycoon3-structure-label {
          display: flex;
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: clamp(7px, 0.75vw, 11px);
          font-weight: 900;
          text-align: center;
          text-shadow: 0 1px 3px #000;
          pointer-events: none;
        }
        .tycoon3-conveyor {
          background-color: #334155;
          background-image: repeating-linear-gradient(
            90deg,
            #475569 0,
            #64748b 5px,
            #334155 10px,
            #475569 15px
          );
          background-size: 30px 100%;
          animation: tycoon3-belt-move 0.65s linear infinite;
          box-shadow: inset 0 1px 2px #fff5, inset 0 -2px 3px #0009;
          position: relative;
          overflow: hidden;
        }
        @keyframes tycoon3-belt-move {
          from { background-position: 0 0; }
          to { background-position: 30px 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tycoon3-conveyor { animation: none; }
        }
        .tycoon-map-footer {
          position: fixed;
          left: 50%;
          bottom: 12px;
          transform: translateX(-50%);
          z-index: 100;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          width: min(1180px, calc(100% - 40px));
          margin: 0;
          padding: 8px;
          border: 1px solid #334155;
          border-radius: 14px;
          background: #111c2e;
          box-shadow: 0 8px 24px #0006;
        }
        .tycoon-map-tab {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: 10px 8px;
          border-radius: 9px;
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          background: #1e293b;
          transition: background .18s ease, color .18s ease;
        }
        .tycoon-map-tab:hover { background: #334155; color: #fff; }
        .tycoon-map-tab.active { color: #172238; background: #facc15; }
        @media (max-width: 760px) {
          .tycoon3-trade-backdrop { padding: 8px; align-items: flex-end; }
          .tycoon3-trade-panel { width: 100%; max-height: 92dvh; border-radius: 16px 16px 10px 10px; }
          .tycoon3-wallet-cards,.tycoon3-rate-grid { grid-template-columns: 1fr; }
          .tycoon3-wallet-cards div { flex-direction: row; align-items: center; }
          .tycoon3-shell {
            width: calc(100% - 20px);
            padding-top: 12px;
            padding-bottom: 96px;
          }
          .tycoon3-topbar { width: 100%; }
          .tycoon3-grid { --tycoon3-cell-size: calc((100dvh - 292px) / 24); }
          .tycoon-map-footer {
            bottom: 8px;
            width: calc(100% - 20px);
            gap: 5px;
            padding: 6px;
          }
          .tycoon-map-tab { min-height: 42px; font-size: 12px; }
        }
        @media (max-width: 420px) {
          .tycoon3-shell { width: calc(100% - 16px); padding-top: 12px; }
          .tycoon-map-footer { width: calc(100% - 16px); }
          .tycoon3-grid { --tycoon3-cell-size: calc((100dvh - 288px) / 24); }
        }
      `}</style>
    </main>
  );
}
