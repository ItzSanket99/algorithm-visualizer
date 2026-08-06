package com.algotrace.engine.tracer;

import com.algotrace.engine.model.CallTree;
import com.algotrace.engine.model.CallTreeNode;
import com.algotrace.engine.model.EventType;
import com.algotrace.engine.model.ExecutionEvent;
import com.algotrace.engine.model.ExecutionTrace;

import java.util.HashMap;
import java.util.Map;

public class CallTreeBuilder {

    public CallTree build(ExecutionTrace trace) {

        CallTree tree = new CallTree();

        Map<Long, CallTreeNode> nodeMap =
                new HashMap<>();

        for (ExecutionEvent event : trace.getEvents()) {

            if (event.getEventType() != EventType.METHOD_ENTER) {
                continue;
            }

            CallTreeNode node =
                    new CallTreeNode(

                            event.getCallId(),

                            event.getParentCallId(),

                            event.getMethodName(),

                            event.getCallDepth(),

                            event.getParameters()

                    );

            nodeMap.put(node.getCallId(), node);

            if (node.getParentCallId() == null) {

                tree.setRoot(node);

            } else {

                CallTreeNode parent =
                        nodeMap.get(node.getParentCallId());

                if (parent != null) {

                    parent.addChild(node);

                }

            }

        }

        return tree;

    }

}