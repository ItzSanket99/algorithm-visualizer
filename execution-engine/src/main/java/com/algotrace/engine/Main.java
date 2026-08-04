package com.algotrace.engine;

import com.algotrace.engine.compiler.CompilationResult;
import com.algotrace.engine.compiler.JavaSourceCompiler;
import com.algotrace.engine.executor.ExecutionResult;
import com.algotrace.engine.executor.JavaExecutor;

public class Main {

    public static void main(String[] args) throws Exception {

        String source = """
                public class Test {

                    public static void main(String[] args) {

                        for(int i = 0; i < 5; i++){
                            System.out.println(i);
                        }

                    }

                }
                """;

        JavaSourceCompiler compiler =
                new JavaSourceCompiler();

        CompilationResult compilationResult =
                compiler.compile(
                        "Test",
                        source
                );

        System.out.println(compilationResult);

        if (!compilationResult.isSuccess()) {

            return;

        }

        JavaExecutor executor =
                new JavaExecutor();

        ExecutionResult executionResult =
                executor.execute("Test");

        System.out.println(executionResult);

    }

}