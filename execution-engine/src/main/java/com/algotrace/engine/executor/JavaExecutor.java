package com.algotrace.engine.executor;

import com.algotrace.engine.util.WorkspaceManager;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;

public class JavaExecutor {

    public ExecutionResult execute(String className) {

        PrintStream originalOut = System.out;

        ByteArrayOutputStream outputStream =
                new ByteArrayOutputStream();

        PrintStream capture =
                new PrintStream(outputStream);

        System.setOut(capture);

        try {

            URLClassLoader classLoader =
                    new URLClassLoader(

                            new URL[]{

                                    WorkspaceManager
                                            .getClassDirectory()
                                            .toUri()
                                            .toURL()

                            }

                    );

            Class<?> clazz =
                    classLoader.loadClass(className);

            Method mainMethod =
                    clazz.getMethod(
                            "main",
                            String[].class
                    );

            mainMethod.invoke(
                    null,
                    (Object) new String[]{}
            );

            classLoader.close();

            System.setOut(originalOut);

            return new ExecutionResult(

                    true,

                    outputStream.toString(),

                    null

            );

        }

        catch (InvocationTargetException ex) {

            System.setOut(originalOut);

            Throwable cause = ex.getCause();

            return new ExecutionResult(

                    false,

                    outputStream.toString(),

                    cause instanceof Exception
                            ? (Exception) cause
                            : new RuntimeException(cause)

            );

        }

        catch (Exception ex) {

            System.setOut(originalOut);

            return new ExecutionResult(

                    false,

                    outputStream.toString(),

                    ex

            );

        }

    }

}