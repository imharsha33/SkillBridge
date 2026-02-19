import { useCallback } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DependencyNode, DependencyEdge } from "@/types/analysis";

interface ConceptGraphProps {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
}

const severityColors: Record<string, { bg: string; border: string }> = {
    critical: { bg: "hsl(0, 72%, 55%)", border: "hsl(0, 72%, 65%)" },
    moderate: { bg: "hsl(38, 92%, 55%)", border: "hsl(38, 92%, 65%)" },
    minor: { bg: "hsl(262, 83%, 65%)", border: "hsl(262, 83%, 75%)" },
    covered: { bg: "hsl(142, 70%, 50%)", border: "hsl(142, 70%, 60%)" },
};

const ConceptGraph = ({ nodes: depNodes, edges: depEdges }: ConceptGraphProps) => {
    const flowNodes: Node[] = depNodes.map((n, i) => ({
        id: n.id,
        position: { x: 150 + (i % 4) * 220, y: 80 + Math.floor(i / 4) * 140 },
        data: { label: n.label },
        style: {
            background: severityColors[n.severity]?.bg || severityColors.covered.bg,
            border: `2px solid ${severityColors[n.severity]?.border || severityColors.covered.border}`,
            borderRadius: "12px",
            padding: "12px 18px",
            color: "#fff",
            fontWeight: 600,
            fontSize: "13px",
            fontFamily: '"Space Grotesk", sans-serif',
        },
    }));

    const flowEdges: Edge[] = depEdges.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: "hsl(215, 20%, 35%)", strokeWidth: 2 },
    }));

    const [nodes, , onNodesChange] = useNodesState(flowNodes);
    const [edges, , onEdgesChange] = useEdgesState(flowEdges);

    return (
        <div className="w-full h-[400px] rounded-2xl overflow-hidden glass">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                proOptions={{ hideAttribution: true }}
            >
                <Background color="hsl(215, 20%, 20%)" gap={20} size={1} />
                <Controls
                    style={{ background: "hsl(230, 25%, 11%)", borderRadius: "8px", border: "1px solid hsl(230, 20%, 18%)" }}
                />
            </ReactFlow>
        </div>
    );
};

export default ConceptGraph;
