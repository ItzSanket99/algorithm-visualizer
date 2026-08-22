package com.algotrace.backend.execution;

import com.algotrace.engine.ExecutionEngine;
import com.algotrace.engine.model.CallTree;
import com.algotrace.engine.model.ExecutionTrace;
import com.algotrace.engine.tracer.CallTreeBuilder;
import org.springframework.stereotype.Service;

@Service
public class ExecutionService {

    private final ExecutionEngine executionEngine;

    private final CallTreeBuilder callTreeBuilder;

    public ExecutionService() {

        this.executionEngine =
                new ExecutionEngine();

        this.callTreeBuilder =
                new CallTreeBuilder();
    }

    public ExecutionResponse execute(
            String sourceCode
    ) {

        if (sourceCode == null ||
                sourceCode.isBlank()) {

            return ExecutionResponse.failure(
                    "Source code cannot be empty."
            );
        }

        try {

            /*
             * Execute student code.
             */
            ExecutionTrace trace =
                    executionEngine.execute(
                            sourceCode
                    );

            /*
             * Build visualization tree.
             */
            CallTree callTree =
                    callTreeBuilder.build(
                            trace
                    );

            /*
             * Prepare frontend data.
             */
            ExecutionData execution =
                    new ExecutionData(

                            trace.getEvents(),

                            callTree.getRoot()

                    );

            return ExecutionResponse.success(
                    execution
            );

        } catch (Exception e) {

            return ExecutionResponse.failure(
                    buildErrorMessage(e)
            );
        }
    }

    private String buildErrorMessage(
            Exception exception
    ) {

        String message =
                exception.getMessage();

        if (message == null ||
                message.isBlank()) {

            return exception
                    .getClass()
                    .getSimpleName();
        }

        return message;
    }
}